<script setup lang="ts">
import { computed, h, ref, useTemplateRef } from 'vue';

import {
  ChronixColumnsToolPanel,
  ChronixFiltersToolPanel,
  ChronixTable,
  type ContextMenuConfig,
  computeColumnReorder,
  type GetRowsParams,
  type GetRowsResult,
  type ServerSideDataSource,
  type ToolPanelConfig,
  type ToolPanelWidthChangePayload,
  type CellRangeChangePayload,
  type CellRangeCopyPayload,
  type CellRangeFillPayload,
  type HeaderGroupClickPayload,
  type HistoryChangePayload,
  type HistoryReplayPayload,
  type MutationHistoryState,
  type CellRangePastePayload,
  type CellRangeStartPayload,
  type CellRangeStopPayload,
  type CellValueChangePayload,
  type ColumnOrderChangePayload,
  computeRowReorder,
  type RowOrderChangePayload,
  type ColumnVisibilityChangePayload,
  type ColumnSpec,
  type ColumnWidthChangePayload,
  type FilterChangePayload,
  type FilterExpression,
  type FilterSpec,
  type MultiFilterEntry,
  type ParseFilterExpressionError,
  type PageChangePayload,
  type RowSpec,
  type SelectionChangePayload,
  type SortChangePayload,
  type SortSpec,
  type TableHandle,
} from '@chronixjs/table-vue3';

const STATUS_CLASS_MAP: Readonly<Record<string, string>> = {
  完成: 'cx-status--done',
  进行中: 'cx-status--wip',
  阻塞: 'cx-status--blocked',
  计划: 'cx-status--planned',
};

// columns is reactive so the
// `column-width-change` emit can rebuild the columns array per
// Decision A.1 (emit-only persistence; chronix-table does not mutate
// the prop). Conversion from `const` to `ref<readonly ColumnSpec[]>`
// is the load-bearing change.
const columns = ref<readonly ColumnSpec[]>([
  // id + name pinned left → stay glued to the
  // body's left edge during horizontal scroll. With the selection rail
  // also on the left (left of the pinned zone), the demo shows a
  // 3-layer left edge: selection rail → pinned zone → center scroll.
  // id + name share `headerGroup: '基础信息'`
  // → render as one labelled group cell spanning both columns in a
  // second header row above the leaf row. qty + price share
  // `headerGroup: '财务'`. status + note stay un-grouped to demo the
  // empty-placeholder branch (Decision B.1).
  { id: 'id', field: 'id', headerName: 'ID', width: 80, pinned: 'left', headerGroup: '基础信息' },
  {
    id: 'name',
    field: 'name',
    headerName: '名称',
    flex: 1,
    minWidth: 120,
    pinned: 'left',
    headerGroup: '基础信息',
  },
  {
    id: 'qty',
    field: 'qty',
    headerName: '数量',
    width: 100,
    // type:'number' wires the filter input to the prefix-
    // syntax parser (parsePrefixNumberFilter) so users can type
    // `5`, `>10`, `<20`, `>=5`, `<=10`, `!=3`, `5..50`.
    type: 'number',
    // valueFormatter prepends a unit label for body cells
    // AND footer cells (the SFC routes the aggregator output through
    // the same formatter so the footer reads "合计 N 件").
    valueFormatter: ({ value }) =>
      typeof value === 'number' ? `${value} 件` : `${String(value ?? 0)} 件`,
    // nested path form — qty + price under
    // 财务 > 订单 (level 0 = 财务 spans both; level 1 = 订单 spans
    // both). Tests the union (string vs array) — id+name stay on the
    // string shortcut form '基础信息'.
    headerGroup: ['财务', '订单'],
    // sum aggregator over filtered rows. The
    // sticky footer renders the result formatted by the same
    // valueFormatter as body cells (so it reads "合计 N 件" — wait,
    // valueFormatter returns "N 件"; consumer wanting the "合计" prefix
    // would either return it from the aggregator or use a custom
    // formatter. Here we keep it simple and let the row read "N 件").
    aggregator: (rs) =>
      rs.reduce((s, r) => s + (typeof r.data['qty'] === 'number' ? r.data['qty'] : 0), 0),
    // per-column body-cell xlsx style. Bold
    // right-aligned numeric format with thousands separator. Header
    // row preserves the bold default (untouched by exportStyle).
    exportStyle: {
      font: { bold: true },
      alignment: { horizontal: 'right' },
      numberFormat: '#,##0',
    },
  },
  {
    // number-typed editable column. No valueFormatter
    // so the editor opens with the raw numeric string (e.g. "9.99")
    // — type:'number' triggers <input type="number"> with
    // inputmode="decimal" + coerceEditDraftValue runs on commit so
    // newValue is a typed number (or null for empty input).
    id: 'price',
    field: 'price',
    headerName: '单价',
    width: 110,
    type: 'number',
    editable: true,
    headerGroup: ['财务', '订单'],
    // average aggregator over filtered rows;
    // the demo uses a custom valueFormatter on the aggregator path by
    // returning a pre-formatted string ("均价 X.XX") so the footer cell
    // distinguishes itself from body cells (which render raw numeric).
    aggregator: (rs) => {
      const nums = rs.map((r) => r.data['price']).filter((v): v is number => typeof v === 'number');
      if (nums.length === 0) return '均价 -';
      const avg = nums.reduce((s, n) => s + n, 0) / nums.length;
      return `均价 ${avg.toFixed(2)}`;
    },
  },
  {
    id: 'status',
    field: 'status',
    headerName: '状态',
    width: 120,
    // state-driven cellClass for status color-coding.
    cellClass: ({ value }) => STATUS_CLASS_MAP[String(value)] ?? 'cx-status--unknown',
    // opt OUT of resize so the user can verify resizable:false
    // suppresses the resizer affordance.
    resizable: false,
    // opt OUT of reorder so the user can verify
    // reorderable:false skips the drag-to-reorder pointer wiring (cursor
    // stays default / pointer for sort, no move-start emit on drag).
    reorderable: false,
    // opt INTO the set-filter dropdown UI.
    // The filter-row cell renders a <details> checkbox list of unique
    // status values instead of the default text input.
    filterUi: 'set',
  },
  // editable: true opts the column into in-cell editing
  // (双击 → input overlay → Enter / Tab / Blur 提交，Esc 取消).
  // autosizeable:false explicit opt-out — the
  // resizer still drag-resizes, but dbl-click does NOT autosize. This
  // demos the per-column opt-OUT independently of resizable:false.
  {
    id: 'note',
    field: 'note',
    headerName: '备注',
    flex: 2,
    minWidth: 160,
    editable: true,
    autosizeable: false,
    // note pinned right → glued to the body's
    // right edge during horizontal scroll. dblclick-to-edit still
    // works inside the pinned cell (wiring is delegated +
    // position-agnostic).
    pinned: 'right',
  },
]);

const STATUS_CYCLE = ['计划', '进行中', '完成', '阻塞'] as const;
const NAME_CYCLE = [
  '需求评审',
  '架构设计',
  '原型联调',
  '后端实现',
  '前端落地',
  '联调测试',
  '性能优化',
  '文档撰写',
  '上线演练',
  '复盘总结',
] as const;
const NOTE_CYCLE = [
  '初稿与利益方对齐',
  '与平台组确认接口契约',
  '依赖第三方 SDK 升级',
  '需补充单元测试',
  '等待 UAT 反馈',
  '本周回归通过',
  '已合入 release 分支',
  '需补充 i18n 资源',
  '与 SRE 协同灰度',
  '归档至 wiki',
] as const;

// rows is reactive so cell-value-change handler can
// mirror commits back into the source-of-truth array.
const rows = ref<readonly RowSpec[]>(
  Array.from({ length: 50 }, (_, i) => {
    const idx = i + 1;
    return {
      id: `r${idx}`,
      data: {
        id: idx,
        name: NAME_CYCLE[i % NAME_CYCLE.length],
        qty: (idx * 7) % 50,
        // numeric prices spanning 0.99..99.50 with one
        // decimal place so the editor exercises float coercion.
        price: Math.round(((idx * 13) % 100) * 10 + 99) / 10,
        status: STATUS_CYCLE[i % STATUS_CYCLE.length],
        note: NOTE_CYCLE[i % NOTE_CYCLE.length],
      },
    };
  }),
);

// + 8.1: track the current sort state (array) for the on-screen indicator.
const currentSort = ref<readonly SortSpec[]>([]);
function onSortChange(payload: SortChangePayload): void {
  currentSort.value = payload.sortSpec;
}
function describeSort(specs: readonly SortSpec[]): string {
  if (specs.length === 0) return '未排序 (点击表头切换；Shift+点击 追加列)';
  const parts = specs.map((spec) => {
    const col = columns.value.find((c) => c.id === spec.colId);
    const label = col?.headerName ?? spec.colId;
    return `「${label}」${spec.direction === 'asc' ? '升序 ▲' : '降序 ▼'}`;
  });
  return `按 ${parts.join(' + ')}`;
}

// track the current filter state for the on-screen indicator.
const currentFilter = ref<readonly FilterSpec[]>([]);
function onFilterChange(payload: FilterChangePayload): void {
  currentFilter.value = payload.filterSpec;
}

// track current quick-find needle + match count.
const currentQuickFindText = ref<string>('');
const currentQuickFindMatchCount = ref<number>(0);
function onQuickFindTextChange(payload: { quickFindText: string }): void {
  currentQuickFindText.value = payload.quickFindText;
  // Match count is derived from the imperative handle (fresh after the
  // transition lands). Re-read on the next microtask so paid layout
  // memos have settled.
  void Promise.resolve().then(() => {
    currentQuickFindMatchCount.value = tableRef.value?.getQuickFindMatchCount() ?? 0;
  });
}
function onQuickFindInput(ev: Event): void {
  const target = ev.target as HTMLInputElement;
  tableRef.value?.setQuickFindText(target.value);
}
function describeQuickFind(text: string, count: number): string {
  if (text === '') return '无 quick-find (输入框为空)';
  return `quick-find "${text}" → ${count} 行匹配`;
}
function describeFilter(specs: readonly FilterSpec[]): string {
  if (specs.length === 0) return '无过滤 (在表头下方输入框中输入)';
  const parts = specs.map((spec) => {
    if (spec.type === 'expression') {
      return `表达式：${spec.source ?? '(IR-only)'}`;
    }
    const col = columns.value.find((c) => c.id === spec.colId);
    const label = col?.headerName ?? spec.colId;
    if (spec.type === 'set') {
      const values = spec.selectedValues;
      if (values == null) return `「${label}」全选`;
      if (values.length === 0) return `「${label}」空选`;
      const display = values
        .slice(0, 3)
        .map((v) => (v === null ? '(空)' : String(v)))
        .join(', ');
      const more = values.length > 3 ? `, …+${values.length - 3}` : '';
      return `「${label}」∈ {${display}${more}}`;
    }
    if (spec.type === 'text') {
      return `「${label}」包含 "${spec.value}"`;
    }
    if (spec.type === 'multi') {
      const active = spec.filters.filter((f: MultiFilterEntry) =>
        f.type === 'text'
          ? (f as { value: string }).value !== ''
          : f.type === 'number'
            ? Number.isFinite((f as { value: number }).value)
            : false,
      ).length;
      return `「${label}」${spec.mode === 'AND' ? '全部' : '任一'} · ${active} 个条件`;
    }
    if (spec.operator === 'inRange') {
      return `「${label}」∈ [${spec.value}, ${spec.valueTo ?? '?'}]`;
    }
    return `「${label}」 ${spec.operator} ${spec.value}`;
  });
  return `已过滤：${parts.join(' AND ')}`;
}

// advanced filter DSL input.
const advancedFilterText = ref<string>('');
const advancedFilterErrors = ref<readonly ParseFilterExpressionError[]>([]);
const advancedFilterStatus = ref<string>('');
function onAdvancedFilterInput(ev: Event): void {
  const target = ev.target as HTMLInputElement;
  advancedFilterText.value = target.value;
}
function onAdvancedFilterApply(): void {
  const handle = tableRef.value;
  if (handle == null) return;
  const result = handle.parseAndSetAdvancedFilter(advancedFilterText.value);
  if (result.ok) {
    advancedFilterErrors.value = [];
    advancedFilterStatus.value = result.expression == null ? '已清空 (输入为空)' : '已应用表达式';
  } else {
    advancedFilterErrors.value = result.errors;
    advancedFilterStatus.value = `解析失败 (${result.errors.length} 错误)`;
  }
}
function onAdvancedFilterClear(): void {
  const handle = tableRef.value;
  if (handle == null) return;
  handle.setAdvancedFilter(null);
  advancedFilterText.value = '';
  advancedFilterErrors.value = [];
  advancedFilterStatus.value = '已清空';
}
function onAdvancedFilterFillExample(): void {
  advancedFilterText.value = 'qty >= 10 AND status = "完成"';
  advancedFilterStatus.value = '示例已填入,点击 应用 生效';
}
// Silence unused-import lint when FilterExpression type lands only in
// the imperative-handle return type below (template doesn't reference it).
type _Phase42Imports = FilterExpression;

// track the current selection for the on-screen pill.
const currentSelection = ref<readonly string[]>([]);
function onSelectionChange(payload: SelectionChangePayload): void {
  currentSelection.value = payload.selectedRowIds;
}
function describeSelection(ids: readonly string[]): string {
  if (ids.length === 0) return '未选择行 (点击选；Ctrl/Cmd+点击 多选切换)';
  if (ids.length <= 5) return `已选 ${ids.length} 行: ${ids.join(', ')}`;
  return `已选 ${ids.length} 行: ${ids.slice(0, 5).join(', ')} 等`;
}

// track current pagination state for the on-screen pill.
// The footer inside <ChronixTable> renders its own page controls;
// the pill mirrors the state for visibility + demonstrates
// page-change emit observability.
const currentPage = ref<number>(0);
const currentPageSize = ref<number>(20);
function onPageChange(payload: PageChangePayload): void {
  currentPage.value = payload.page;
  currentPageSize.value = payload.pageSize;
}
function describePage(page: number, pageSize: number): string {
  const total = rows.value.length;
  const visibleStart = page * pageSize + 1;
  const visibleEnd = Math.min((page + 1) * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  return `第 ${page + 1} / ${totalPages} 页 — 显示 ${visibleStart}-${visibleEnd} / ${total} 行`;
}

// track the last cell edit + write it back into rows.
// chronix-table itself does NOT mutate rows — consumers (demo
// here) own the persistence path. We mirror by writing into the
// row's data object then triggering rows.value reassignment so
// the table picks up the new identity.
const lastEdit = ref<string>('');
function onCellValueChange(payload: CellValueChangePayload): void {
  const next = rows.value.map((row) => {
    if (row.id !== payload.row.id) return row;
    return {
      ...row,
      data: { ...row.data, [payload.column.field ?? payload.column.id]: payload.newValue },
    };
  });
  rows.value = next;
  lastEdit.value = `${payload.row.id}/${payload.column.id}: "${String(payload.oldValue)}" → "${String(payload.newValue)}"`;
}
function describeLastEdit(text: string): string {
  return text === '' ? '未编辑 (双击 备注 列 → 输入 → Enter 提交)' : `最近编辑: ${text}`;
}

// track the last column resize + rebuild the
// columns array per Decision A.1 (emit-only persistence — chronix
// does NOT mutate the columns prop). The rebuild sets the column's
// width to the new value and clears `flex` per Decision B.1 so
// resizing a flex column converts it to explicit width while other
// flex columns keep their proportional share of the remaining space.
const lastResize = ref<string>('');
function onColumnWidthChange(payload: ColumnWidthChangePayload): void {
  columns.value = columns.value.map((c) => {
    if (c.id !== payload.column.id) return c;
    // Destructure-omit `flex` so the column converts cleanly to
    // explicit width per Decision B.1 — `flex: undefined` would be
    // rejected by the package's `exactOptionalPropertyTypes: true`
    // tsconfig (`flex` is typed as `number | undefined` only via
    // optionality, not via union).
    const { flex: _omittedFlex, ...rest } = c;
    return { ...rest, width: payload.newWidth };
  });
  const label = payload.column.headerName ?? payload.column.id;
  lastResize.value = `${label}: ${payload.oldWidth.toFixed(0)}px → ${payload.newWidth.toFixed(0)}px`;
}
function describeLastResize(text: string): string {
  return text === '' ? '未调整列宽 (悬浮表头右边缘 → 拖动)' : `最近列宽变更: ${text}`;
}

// track the last column reorder + rebuild the
// columns array via `computeColumnReorder` per Decision A.1 (emit-only
// persistence; chronix-table does NOT mutate the columns prop). The pure
// helper handles the splice + reinsert math including no-op-position
// detection.
const lastReorder = ref<string>('');
function onColumnOrderChange(payload: ColumnOrderChangePayload): void {
  columns.value = computeColumnReorder(
    columns.value,
    payload.movedColumn.id,
    payload.targetColumn.id,
    payload.position,
  );
  const movedLabel = payload.movedColumn.headerName ?? payload.movedColumn.id;
  const targetLabel = payload.targetColumn.headerName ?? payload.targetColumn.id;
  const positionLabel = payload.position === 'before' ? '前' : '后';
  lastReorder.value = `${movedLabel} → ${targetLabel} 之${positionLabel}`;
}

// row drag — emit-only persistence. Consumer
// rebuilds props.rows via `computeRowReorder` inside the row-order-
// change handler.
const lastRowReorder = ref<string>('');
function onRowOrderChange(payload: RowOrderChangePayload): void {
  rows.value = computeRowReorder(
    rows.value,
    payload.movedRow.id,
    payload.targetRow.id,
    payload.position,
  );
  const positionLabel = payload.position === 'above' ? '上方' : '下方';
  lastRowReorder.value = `${payload.movedRow.id} → ${payload.targetRow.id} ${positionLabel}`;
}
function describeLastReorder(text: string): string {
  return text === ''
    ? '未拖拽列序 (拖动表头单元格 ≥ 5px → 落点 gap-line 显示)'
    : `最近列序变更: ${text}`;
}

// track the last visibility change + rebuild the
// columns array with the new `hide` value per Decision A.1 (emit-only
// persistence; chronix-table does NOT mutate the columns prop).
const lastVisibilityChange = ref<string>('');
function onColumnVisibilityChange(payload: ColumnVisibilityChangePayload): void {
  columns.value = columns.value.map((c) =>
    c.id === payload.column.id ? { ...c, hide: payload.hidden } : c,
  );
  const label = payload.column.headerName ?? payload.column.id;
  lastVisibilityChange.value = `${label} → ${payload.hidden ? '隐藏' : '显示'}`;
}
function describeLastVisibilityChange(text: string): string {
  return text === ''
    ? '未切换列显隐 (点击右上角 “列” 按钮 → 勾选/取消勾选 列名)'
    : `最近列显隐: ${text}`;
}

// wire the imperative autosize TableHandle methods
// via a template ref captured by `useTemplateRef`. Dbl-click on the
// resizer triggers autosize natively from the SFC; these buttons cover
// the programmatic API + the autosize-all batch.
const tableRef = useTemplateRef<TableHandle>('table');
function onAutosizeAll(): void {
  tableRef.value?.autosizeAllColumns();
}
function onAutosizeQty(): void {
  tableRef.value?.autosizeColumn('qty');
}

// cell-range selection demo state. Track the
// last range envelope + the gesture-source pill so the user can see
// drag-extend / shift+click-extend / imperative wiring work end-to-end.
const lastRange = ref<string>('');
function describeRange(s: string): string {
  return s === ''
    ? '未选择 cell 区域 (在 cell 上 pointerdown + drag 选区；shift+click 延伸；按钮可程序化设定/清空)'
    : `最近 cell-range: ${s}`;
}
function formatRangePayload(
  payload: CellRangeStartPayload | CellRangeChangePayload | CellRangeStopPayload,
): string {
  const { anchor, focus } = payload.range;
  if ('envelope' in payload) {
    const { rowIds, colIds } = payload.envelope;
    return `${anchor.rowId}/${anchor.colId} → ${focus.rowId}/${focus.colId} (${rowIds.length}×${colIds.length} = ${rowIds.length * colIds.length} cells)`;
  }
  return `start: ${anchor.rowId}/${anchor.colId}`;
}
function onCellRangeStart(payload: CellRangeStartPayload): void {
  lastRange.value = formatRangePayload(payload);
}
function onCellRangeChange(payload: CellRangeChangePayload): void {
  lastRange.value = formatRangePayload(payload);
}
function onCellRangeStop(payload: CellRangeStopPayload): void {
  lastRange.value = `committed — ${formatRangePayload(payload)}`;
}
function onSetCellRange(): void {
  tableRef.value?.setCellRange({
    anchor: { rowId: 'r1', colId: 'name' },
    focus: { rowId: 'r5', colId: 'price' },
  });
}
function onClearCellRange(): void {
  tableRef.value?.clearCellRange();
}

// clipboard copy demo state. Shows the first
// 80 chars of the most-recently-copied TSV so the user can verify
// the same value lands on the clipboard. Pill renders both the
// keyboard (Ctrl+C) path and the programmatic copy-button path.
const lastCopiedTsv = ref<string>('');
function describeCopiedTsv(s: string): string {
  if (s === '') {
    return '未复制 cell-range (在 cell-range 激活后按 Ctrl+C / Cmd+C 复制为 TSV → 粘到 Excel / Sheets / Notion)';
  }
  const head = s.length > 80 ? `${s.slice(0, 80)}…` : s;
  // Visualize tabs + newlines so the pill doesn't render as a single
  // squished line of text.
  const visualized = head.replaceAll('\t', '→').replaceAll('\n', ' ⏎ ');
  return `最近复制 (${s.length} chars): ${visualized}`;
}
function onCellRangeCopy(payload: CellRangeCopyPayload): void {
  lastCopiedTsv.value = payload.text;
}
async function onCopyCellRange(): Promise<void> {
  await tableRef.value?.copyCellRangeToClipboard();
}

// clipboard paste demo state. Tracks the most
// recent paste mutations + applies them to the reactive `rows` array
// (emit-only persistence — chronix-table doesn't mutate the rows
// prop; consumer mirrors via the mutations array per Decision B.1).
const lastPasteSummary = ref<string>('');
function describePasteSummary(s: string): string {
  return s === ''
    ? '未粘贴 cell-range (cell-range 激活后按 Ctrl+V / Cmd+V → 粘贴 TSV 到选区；按钮也可程序化触发)'
    : `最近粘贴 mutations: ${s}`;
}
function onCellRangePaste(payload: CellRangePastePayload): void {
  if (payload.mutations.length === 0) {
    lastPasteSummary.value = `0 mutations (paste 无变化 / 全 no-op / 全 reject)`;
    return;
  }
  // Build a Map for O(1) lookup during write-back.
  const byKey = new Map<string, unknown>();
  for (const m of payload.mutations) {
    byKey.set(`${m.rowId}/${m.colId}`, m.newValue);
  }
  // Mirror mutations back into the rows array (chronix-table doesn't
  // mutate the rows prop — consumer owns persistence).
  rows.value = rows.value.map((row) => {
    let nextData: Record<string, unknown> | null = null;
    for (const col of columns.value) {
      const key = `${row.id}/${col.id}`;
      if (!byKey.has(key)) continue;
      nextData ??= { ...row.data };
      const field = col.field ?? col.id;
      nextData[field] = byKey.get(key);
    }
    return nextData == null ? row : { ...row, data: nextData };
  });
  const sample = payload.mutations
    .slice(0, 3)
    .map((m) => `${m.rowId}/${m.colId}=${String(m.newValue)}`)
    .join(', ');
  const more = payload.mutations.length > 3 ? ` (+${payload.mutations.length - 3} 更多)` : '';
  lastPasteSummary.value = `${payload.mutations.length} cells: ${sample}${more}`;
}
async function onPasteCellRange(): Promise<void> {
  await tableRef.value?.pasteCellRangeFromClipboard();
}

// drag-fill demo state. Tracks the most recent
// fill mutations + applies them to the reactive `rows` array (emit-only
// persistence — same shape as the paste handler).
const lastFillSummary = ref<string>('');
function describeFillSummary(s: string): string {
  return s === ''
    ? '未触发 drag-fill (cell-range 激活后 drag 右下角小方块 → 沿主导轴方向 axis-lock 填充；按钮也可程序化触发)'
    : `最近 fill mutations: ${s}`;
}
function onCellRangeFill(payload: CellRangeFillPayload): void {
  if (payload.mutations.length === 0) {
    lastFillSummary.value = `0 mutations (fill 无变化 / 全 no-op)`;
    return;
  }
  const byKey = new Map<string, unknown>();
  for (const m of payload.mutations) {
    byKey.set(`${m.rowId}/${m.colId}`, m.newValue);
  }
  rows.value = rows.value.map((row) => {
    let nextData: Record<string, unknown> | null = null;
    for (const col of columns.value) {
      const key = `${row.id}/${col.id}`;
      if (!byKey.has(key)) continue;
      nextData ??= { ...row.data };
      const field = col.field ?? col.id;
      nextData[field] = byKey.get(key);
    }
    return nextData == null ? row : { ...row, data: nextData };
  });
  const sample = payload.mutations
    .slice(0, 3)
    .map((m) => `${m.rowId}/${m.colId}=${String(m.newValue)}`)
    .join(', ');
  const more = payload.mutations.length > 3 ? ` (+${payload.mutations.length - 3} 更多)` : '';
  lastFillSummary.value = `${payload.mutations.length} cells: ${sample}${more}`;
}
function onFillToR10Qty(): void {
  // Programmatic drag-fill demo: requires an active range first.
  tableRef.value?.setCellRange({
    anchor: { rowId: 'r1', colId: 'qty' },
    focus: { rowId: 'r1', colId: 'qty' },
  });
  tableRef.value?.fillCellRange({ rowId: 'r10', colId: 'qty' });
}

// undo / redo demo state. enableUndoHistory:
// true on <ChronixTable> auto-records every cell-edit / paste / fill
// gesture; the history-replay emit carries the (already-reversed for
// undo / original for redo) mutations array — consumer applies via
// the same Map-keyed write-back used for paste / fill. The
// history-change emit drives the canUndo/canRedo button-disabled state.
const undoHistoryState = ref<MutationHistoryState>({ past: [], future: [] });
const lastHistoryReplay = ref<string>('');
const canUndoNow = computed(() => undoHistoryState.value.past.length > 0);
const canRedoNow = computed(() => undoHistoryState.value.future.length > 0);
function describeHistoryState(s: MutationHistoryState): string {
  return `undo stack: past=${s.past.length} future=${s.future.length} (Ctrl+Z/Y or buttons)`;
}
function describeHistoryReplay(s: string): string {
  return s === '' ? '未触发 undo/redo' : `最近 history-replay: ${s}`;
}
function onHistoryChange(payload: HistoryChangePayload): void {
  undoHistoryState.value = payload.history;
}
function onHistoryReplay(payload: HistoryReplayPayload): void {
  // Apply the (already-reversed-for-undo / original-for-redo) mutations
  // to the rows array — same Map-keyed batch-apply as paste / fill.
  const byKey = new Map<string, unknown>();
  for (const m of payload.batch.mutations) {
    byKey.set(`${m.rowId}/${m.colId}`, m.newValue);
  }
  rows.value = rows.value.map((row) => {
    let nextData: Record<string, unknown> | null = null;
    for (const col of columns.value) {
      const key = `${row.id}/${col.id}`;
      if (!byKey.has(key)) continue;
      nextData ??= { ...row.data };
      const field = col.field ?? col.id;
      nextData[field] = byKey.get(key);
    }
    return nextData == null ? row : { ...row, data: nextData };
  });
  const sample = payload.batch.mutations
    .slice(0, 3)
    .map((m) => `${m.rowId}/${m.colId}=${String(m.newValue)}`)
    .join(', ');
  const more =
    payload.batch.mutations.length > 3 ? ` (+${payload.batch.mutations.length - 3} 更多)` : '';
  lastHistoryReplay.value = `${payload.direction} (${payload.batch.source}) ${payload.batch.mutations.length} cells: ${sample}${more}`;
}
// header-group-click state pill. The labelled
// group cells in the second header row emit this when clicked; empty
// placeholder cells do NOT emit (no `data-group-name` attr to resolve).
const lastHeaderGroupClick = ref<string>('');
function describeLastHeaderGroupClick(s: string): string {
  return s === '' ? '未触发 header-group-click' : `最近 header-group-click: ${s}`;
}
function onHeaderGroupClick(payload: HeaderGroupClickPayload): void {
  lastHeaderGroupClick.value = `${payload.groupName} (${payload.colIds.length} cols: ${payload.colIds.join(', ')})`;
}

function onUndoClick(): void {
  tableRef.value?.undo();
}
function onRedoClick(): void {
  tableRef.value?.redo();
}
function onClearHistoryClick(): void {
  tableRef.value?.clearHistory();
}

// opt-out toggle for keyboard auto-scroll. Default
// ON; flipping OFF lets the user verify the active outline persists on a
// cell scrolled out of view (proving the active state lives in IR, not
// in DOM-focus).
const enableAutoScroll = ref<boolean>(true);
function onExportCsv(): void {
  tableRef.value?.exportToCsv('chronix-table-demo.csv', { rowSource: 'filtered' });
}

// xlsx export demo handler. Async — awaits the
// dynamic exceljs import + workbook serialization before the anchor
// click fires. Optional exceljs peer dep is installed at the demo
// level so the real export path runs.
const xlsxBusy = ref<boolean>(false);
const xlsxError = ref<string>('');
async function onExportXlsx(): Promise<void> {
  if (xlsxBusy.value) return;
  xlsxBusy.value = true;
  xlsxError.value = '';
  try {
    await tableRef.value?.exportToXlsx('chronix-table-demo.xlsx', {
      rowSource: 'filtered',
      xlsxOptions: { sheetName: 'Chronix Demo' },
    });
  } catch (err) {
    xlsxError.value = err instanceof Error ? err.message : String(err);
  } finally {
    xlsxBusy.value = false;
  }
}

// multi-sheet xlsx demo — produce a workbook
// with 3 sheets (Filtered / All / Selected).
async function onExportXlsxMultiSheet(): Promise<void> {
  if (xlsxBusy.value) return;
  xlsxBusy.value = true;
  xlsxError.value = '';
  try {
    await tableRef.value?.exportToXlsxMultiSheet('chronix-table-multi-sheet.xlsx', [
      // demo per-sheet freeze-pane. The
      // Filtered sheet freezes the first column + the header row;
      // the All sheet freezes nothing; the Selected sheet freezes
      // just the header row.
      {
        sheetName: 'Filtered',
        rowSource: 'filtered',
        xlsxOptions: { freezePane: { xSplit: 1, ySplit: 1 } },
      },
      { sheetName: 'All', rowSource: 'all' },
      {
        sheetName: 'Selected',
        rowSource: 'selected',
        xlsxOptions: { freezePane: { ySplit: 1 } },
      },
    ]);
  } catch (err) {
    xlsxError.value = err instanceof Error ? err.message : String(err);
  } finally {
    xlsxBusy.value = false;
  }
}

// saved-views demo. Uses localStorage as a
// persistence layer per the consumer-owns-persistence stance (core
// helpers are I/O-free). The two buttons demonstrate the full round-
// trip: serialize via getTableView() + JSON.stringify, then restore
// via JSON.parse + applyTableView(). The `columns-change` emit fires
// once on restore with the reconciled array; the demo handler swaps
// `columns.value` in a single mutation.
const SAVED_VIEW_KEY = 'chronix-table-vue3-demo-saved-view';
const savedViewStatus = ref<string>('');
function onSaveView(): void {
  const view = tableRef.value?.getTableView();
  if (view == null) return;
  localStorage.setItem(SAVED_VIEW_KEY, JSON.stringify(view));
  savedViewStatus.value = `saved (${view.columns.length} cols, sort=${view.sort.length}, filter=${view.filter.length})`;
}
function onLoadView(): void {
  const raw = localStorage.getItem(SAVED_VIEW_KEY);
  if (raw == null) {
    savedViewStatus.value = 'no saved view';
    return;
  }
  try {
    const parsed = JSON.parse(raw) as { version: number };
    tableRef.value?.applyTableView(parsed as never);
    savedViewStatus.value = 'loaded';
  } catch (err) {
    savedViewStatus.value = `parse error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
function onColumnsChange(payload: { columns: readonly ColumnSpec[]; reason: string }): void {
  // atomic prop rebuild on applyTableView. The emit fires
  // ONCE with the reconciled array; do a single ref.value = next.
  columns.value = payload.columns;
}
function onJumpFarActiveCell(): void {
  // programmatic setActiveCell to a far cell — exercises the
  // auto-scroll path that the keyboard nav also hits. r19 is the last
  // row on page 1 (page size = 20) so it's definitely below the visible
  // viewport, and `qty` is a center (non-pinned) column.
  tableRef.value?.setActiveCell('r19', 'qty');
}

/**
 * file-tree demo data. ~85 rows nested 4 levels
 * deep — projects (level 0) → modules (level 1) → folders (level 2) →
 * files (level 3). Sizes / dates synthesized deterministically so the
 * demo renders identically across runs.
 */
interface FileRow extends RowSpec {
  readonly data: {
    readonly name: string;
    readonly type: 'project' | 'module' | 'folder' | 'file';
    readonly size: number;
    readonly modified: string;
  };
}

function makeFileTree(): readonly RowSpec[] {
  const projects = ['chronix-table', 'chronix-gantt', 'chronix-grid'];
  const modules = ['core', 'adapters', 'examples'];
  const folders = ['src', 'tests'];
  const files = ['index.ts', 'utils.ts', 'types.ts', 'helpers.ts'];

  const out: FileRow[] = [];
  for (let p = 0; p < projects.length; p++) {
    const projectName = projects[p] ?? 'project';
    const moduleChildren: FileRow[] = [];
    for (let m = 0; m < modules.length; m++) {
      const moduleName = modules[m] ?? 'module';
      const folderChildren: FileRow[] = [];
      for (let f = 0; f < folders.length; f++) {
        const folderName = folders[f] ?? 'folder';
        const fileChildren: FileRow[] = [];
        for (let i = 0; i < files.length; i++) {
          const fileName = files[i] ?? 'file.ts';
          fileChildren.push({
            id: `${projectName}/${moduleName}/${folderName}/${fileName}`,
            data: {
              name: fileName,
              type: 'file' as const,
              size: 500 + ((p * 17 + m * 13 + f * 7 + i * 5) % 4000),
              modified: `2026-05-${20 + ((p + m + f + i) % 7)}`,
            },
          });
        }
        folderChildren.push({
          id: `${projectName}/${moduleName}/${folderName}`,
          data: {
            name: folderName,
            type: 'folder' as const,
            size: fileChildren.reduce((sum, fc) => sum + fc.data.size, 0),
            modified: '2026-05-25',
          },
          children: fileChildren,
        });
      }
      moduleChildren.push({
        id: `${projectName}/${moduleName}`,
        data: {
          name: moduleName,
          type: 'module' as const,
          size: folderChildren.reduce((sum, fc) => sum + fc.data.size, 0),
          modified: '2026-05-26',
        },
        children: folderChildren,
      });
    }
    out.push({
      id: projectName,
      data: {
        name: projectName,
        type: 'project' as const,
        size: moduleChildren.reduce((sum, mc) => sum + mc.data.size, 0),
        modified: '2026-05-28',
      },
      children: moduleChildren,
    });
  }
  return out;
}

const treeRows = ref<readonly RowSpec[]>(makeFileTree());

const treeColumns = ref<readonly ColumnSpec[]>([
  { id: 'name', field: 'name', headerName: '名称', flex: 2, treeColumn: true, resizable: true },
  {
    id: 'type',
    field: 'type',
    headerName: '类型',
    width: 100,
    cellClass: ({ value }) => `cx-tree-type--${String(value)}`,
  },
  {
    id: 'size',
    field: 'size',
    headerName: '大小 (B)',
    width: 120,
    type: 'number',
    valueFormatter: ({ value }) => (typeof value === 'number' ? value.toLocaleString('zh-CN') : ''),
  },
  { id: 'modified', field: 'modified', headerName: '修改日期', width: 120 },
]);

const treeExpandedCount = ref(0);
function onTreeExpandedChange(payload: { readonly next: readonly string[] }): void {
  treeExpandedCount.value = payload.next.length;
}

const treeTableRef = useTemplateRef<TableHandle | null>('treeTable');

function onTreeExpandAll(): void {
  // Collect every parent id from the input tree recursively.
  const parents: string[] = [];
  const walk = (rows: readonly RowSpec[]): void => {
    for (const row of rows) {
      if (row.children != null && row.children.length > 0) {
        parents.push(row.id);
        walk(row.children);
      }
    }
  };
  walk(treeRows.value);
  for (const id of parents) treeTableRef.value?.expandRow(id);
}

function onTreeCollapseAll(): void {
  const walk = (rows: readonly RowSpec[]): void => {
    for (const row of rows) {
      if (row.children != null && row.children.length > 0) {
        treeTableRef.value?.collapseRow(row.id);
        walk(row.children);
      }
    }
  };
  walk(treeRows.value);
}

// + 32 + 33 demo (2026-05-28): pinned rows + tooltip + overlay.
// Reuses the main `rows` data; synthesizes top + bottom "summary" rows
// via RowSpec.pinned, declares tooltipField on the 备注 column, and
// wires loading + no-rows toggle controls.
const tier2Loading = ref(false);
const tier2EmptyMode = ref(false);
const tier2Columns = ref<readonly ColumnSpec[]>([
  { id: 'name', field: 'name', headerName: '名称', flex: 2 },
  { id: 'qty', field: 'qty', headerName: '数量', type: 'number', width: 80 },
  { id: 'price', field: 'price', headerName: '单价', type: 'number', width: 100 },
  { id: 'status', field: 'status', headerName: '状态', width: 120 },
  {
    id: 'note',
    field: 'note',
    headerName: '备注',
    flex: 1,
    tooltipField: 'note',
  },
]);
const tier2BaseRows = computed<readonly RowSpec[]>(() => {
  if (tier2EmptyMode.value) return [];
  return rows.value.slice(0, 12);
});
const tier2Rows = computed<readonly RowSpec[]>(() => {
  const base = tier2BaseRows.value;
  if (base.length === 0) return base;
  const pinnedTop: RowSpec = {
    id: 'pinned-top-summary',
    data: { name: '⭐ 置顶汇总', qty: '—', price: '—', status: 'TOP', note: '本表顶端常驻汇总行' },
    pinned: 'top',
  };
  const sumQty = base.reduce((n, r) => n + ((r.data['qty'] as number) ?? 0), 0);
  const sumPrice = base.reduce((n, r) => n + ((r.data['price'] as number) ?? 0), 0);
  const pinnedBottom: RowSpec = {
    id: 'pinned-bottom-total',
    data: {
      name: '合计',
      qty: sumQty,
      price: Number(sumPrice.toFixed(1)),
      status: 'TOTAL',
      note: `${base.length} 行汇总`,
    },
    pinned: 'bottom',
  };
  return [pinnedTop, ...base, pinnedBottom];
});
function onTier2ToggleLoading(): void {
  tier2Loading.value = !tier2Loading.value;
}
function onTier2ToggleEmpty(): void {
  tier2EmptyMode.value = !tier2EmptyMode.value;
}

// demo (2026-05-28): lazy-load tree children. Synthetic
// childrenLoader returns hardcoded data after a 500ms setTimeout.
// One injected failure path: rowId 'lazy-fail-1' always rejects.
const lazyRoots = ref<readonly RowSpec[]>([
  { id: 'lazy-folder-a', data: { name: '📁 folder-a', size: '—' }, hasChildren: true },
  { id: 'lazy-folder-b', data: { name: '📁 folder-b', size: '—' }, hasChildren: true },
  { id: 'lazy-fail-1', data: { name: '⚠ folder-fails', size: '—' }, hasChildren: true },
  { id: 'lazy-leaf-1', data: { name: '📄 leaf-1.txt', size: '12 KB' } },
]);
const lazyColumns = ref<readonly ColumnSpec[]>([
  { id: 'name', field: 'name', headerName: '名称', flex: 2, treeColumn: true },
  { id: 'size', field: 'size', headerName: '大小', width: 100 },
]);
const lazyLoadCounts = ref({ start: 0, success: 0, error: 0 });
const lazyTableRef = useTemplateRef<TableHandle>('lazyTable');
const lazyChildrenLoader = async (args: {
  readonly parent: RowSpec;
  readonly signal: AbortSignal;
}): Promise<readonly RowSpec[]> => {
  const { parent, signal } = args;
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, 500);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
  if (parent.id === 'lazy-fail-1') {
    throw new Error('synthetic load failure');
  }
  return [
    { id: `${parent.id}/child-1`, data: { name: `📄 ${parent.id}/child-1.ts`, size: '4 KB' } },
    { id: `${parent.id}/child-2`, data: { name: `📄 ${parent.id}/child-2.ts`, size: '8 KB' } },
    {
      id: `${parent.id}/child-3`,
      data: { name: `📁 ${parent.id}/nested`, size: '—' },
      hasChildren: true,
    },
  ];
};
function onLazyStart(): void {
  lazyLoadCounts.value = { ...lazyLoadCounts.value, start: lazyLoadCounts.value.start + 1 };
}
function onLazySuccess(): void {
  lazyLoadCounts.value = { ...lazyLoadCounts.value, success: lazyLoadCounts.value.success + 1 };
}
function onLazyError(): void {
  lazyLoadCounts.value = { ...lazyLoadCounts.value, error: lazyLoadCounts.value.error + 1 };
}
function onLazyInvalidateAll(): void {
  lazyTableRef.value?.invalidateLazyChildren();
}

// server-side row model demo. Toggle the mode
// to switch the same column set between a clientSide rows list and a
// mock-async server returning 250 rows in chunks (500ms latency per
// block). The serverSideDataSource implements the consumer contract +
// honors the AbortSignal so view changes mid-flight cancel cleanly.
const serverSideTotalRows = 250;
function buildServerSideRow(i: number): RowSpec {
  const status = ['完成', '进行中', '阻塞', '计划'][i % 4]!;
  return {
    id: `srv-${i}`,
    data: {
      id: i + 1,
      name: `远端项 #${i + 1}`,
      qty: 10 + (i % 90),
      price: 100 + ((i * 7) % 9999),
      status,
      note: i % 5 === 0 ? '需关注' : '',
    },
  };
}
const mockServerSideDataSource: ServerSideDataSource = {
  getRows(params: GetRowsParams): Promise<GetRowsResult> {
    return new Promise<GetRowsResult>((resolve, reject) => {
      const handle = setTimeout(() => {
        const slice: RowSpec[] = [];
        const end = Math.min(params.endRow, serverSideTotalRows);
        for (let i = params.startRow; i < end; i++) slice.push(buildServerSideRow(i));
        resolve({ rows: slice, totalRowCount: serverSideTotalRows });
      }, 500);
      params.signal.addEventListener('abort', () => {
        clearTimeout(handle);
        reject(new Error('aborted'));
      });
    });
  },
};
const rowModelType = ref<'clientSide' | 'serverSide'>('serverSide');
// demo wiring: paginationEnabled toggle for
// server-side mode. When ON, pageSize OVERRIDES cacheBlockSize (page N
// maps 1:1 to block N). Default OFF to preserve the original
// demo behavior.
const serverSidePaginationEnabled = ref<boolean>(false);
function onToggleServerSidePagination(): void {
  serverSidePaginationEnabled.value = !serverSidePaginationEnabled.value;
}
// demo wiring: invalidate block 0 only —
// preserves totalRowCount + other blocks + lets the SFC re-fetch block 0
// on next read. Contrast with `refreshServerSideRows()` (whole-cache nuke).
function onInvalidateServerSideBlock0(): void {
  serverSideTableRef.value?.invalidateServerSideBlocks([0]);
}
const serverSideColumns: readonly ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: '名称', flex: 1 },
  { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
  { id: 'price', field: 'price', headerName: '价格', width: 120 },
  { id: 'status', field: 'status', headerName: '状态', width: 100 },
  { id: 'note', field: 'note', headerName: '备注', width: 120 },
];
const serverSideTableRef = useTemplateRef<TableHandle>('serverSideTable');
function onToggleRowModelType(): void {
  rowModelType.value = rowModelType.value === 'serverSide' ? 'clientSide' : 'serverSide';
}
function onRefreshServerSide(): void {
  serverSideTableRef.value?.refreshServerSideRows();
}

// Tier 3 finale demo data + handlers.
const tier3Counter = ref<Record<string, number>>({});
const tier3Rows: readonly RowSpec[] = [
  {
    id: 'task-1',
    data: {
      title: '修复登录页样式',
      assignee: 'Alice',
      notes:
        '修复主登录页的暗色模式按钮颜色 + 优化输入框 hover/focus 状态过渡。涉及 Login.vue + ThemeToggle.vue 两个组件。',
      protected: false,
    },
  },
  {
    id: 'task-2',
    data: {
      title: '升级 Vue 3.5',
      assignee: 'Bob',
      notes: '升级后需要校验所有路由守卫和异步组件。',
      protected: true,
    },
  },
  {
    id: 'task-3',
    data: {
      title: '新增数据导出',
      assignee: 'Carol',
      notes: '需要支持 CSV + xlsx 双格式;遵守现有 export 流程;对接 loading overlay。',
      protected: false,
    },
  },
];
const tier3Columns: readonly ColumnSpec[] = [
  { id: 'num', headerName: '#', width: 50, rowNumber: true, pinned: 'left' },
  { id: 'title', field: 'title', headerName: '标题', width: 200 },
  { id: 'assignee', field: 'assignee', headerName: '负责人', width: 120 },
  { id: 'notes', field: 'notes', headerName: '说明', flex: 1, wrapText: true },
  {
    id: 'actions',
    headerName: '操作',
    width: 180,
    pinned: 'right',
    actions: [
      {
        id: 'edit',
        label: '编辑',
        icon: '✏️',
        onClick: (row) => {
          tier3Counter.value = {
            ...tier3Counter.value,
            [`${row.id}/edit`]: (tier3Counter.value[`${row.id}/edit`] ?? 0) + 1,
          };
        },
      },
      {
        id: 'delete',
        label: '删除',
        icon: '🗑',
        disabled: (row) => row.data['protected'] === true,
        onClick: (row) => {
          tier3Counter.value = {
            ...tier3Counter.value,
            [`${row.id}/delete`]: (tier3Counter.value[`${row.id}/delete`] ?? 0) + 1,
          };
        },
      },
    ],
  },
];
const tier3LastEditCount = computed(() =>
  Object.entries(tier3Counter.value)
    .filter(([k]) => k.endsWith('/edit'))
    .reduce((s, [, v]) => s + v, 0),
);
const tier3LastDeleteCount = computed(() =>
  Object.entries(tier3Counter.value)
    .filter(([k]) => k.endsWith('/delete'))
    .reduce((s, [, v]) => s + v, 0),
);

// Tool-panel container demo. The container
// hosts 2 consumer-supplied tool panels (Info + Help). Renderers
// close over reactive state (rows.value.length, selection count)
// so the panels stay in sync with the table.
const toolPanelLastWidth = ref<number>(280);
const toolPanelConfig = computed<ToolPanelConfig>(() => ({
  show: true,
  side: 'right',
  initialOpenId: 'info',
  initialWidth: toolPanelLastWidth.value,
  panels: [
    {
      id: 'info',
      label: 'Info',
      icon: 'ⓘ',
      renderer: () =>
        h('div', { class: 'demo-tool-panel-body' }, [
          h('h4', '表格信息'),
          h('p', `行数: ${rows.value.length}`),
          h('p', `列数: ${columns.value.length}`),
          h('p', { class: 'demo-tool-panel-hint' }, '面板可以拖拽边缘调整宽度,关闭面板按图标。'),
        ]),
    },
    {
      id: 'columns',
      label: 'Columns',
      icon: '⛶',
      renderer: () =>
        h(ChronixColumnsToolPanel, {
          tableHandle: tableRef.value,
          columns: columns.value,
        }),
    },
    {
      id: 'filters',
      label: 'Filters',
      icon: '⛁',
      renderer: () =>
        h(ChronixFiltersToolPanel, {
          tableHandle: tableRef.value,
          columns: columns.value,
          filterSpec: currentFilter.value,
        }),
    },
    {
      id: 'help',
      label: 'Help',
      icon: '?',
      renderer: () =>
        h('div', { class: 'demo-tool-panel-body' }, [
          h('h4', '快捷键'),
          h('ul', [
            h('li', 'Ctrl+Z / Ctrl+Y — 撤销 / 重做'),
            h('li', 'Shift+Click — 范围选择'),
            h('li', 'Enter — 进入编辑'),
          ]),
        ]),
    },
  ],
}));
function onToolPanelWidthChange(payload: ToolPanelWidthChangePayload): void {
  toolPanelLastWidth.value = payload.width;
}

// context-menu config + last-action mirror so the
// header strip can display what the user just picked from a cell right-click.
const phase83LastContextAction = ref<string>('—');
const phase83ContextMenuConfig = computed<ContextMenuConfig>(() => ({
  items: [
    {
      id: 'copy-cell',
      label: '复制单元格',
      icon: '📋',
      onClick: (ctx) => {
        phase83LastContextAction.value = `复制 ${ctx.rowId}/${ctx.colId}`;
      },
    },
    {
      id: 'inspect',
      label: '查看单元格信息',
      icon: 'ℹ️',
      onClick: (ctx) => {
        phase83LastContextAction.value = `查看 ${ctx.rowId}/${ctx.colId}`;
      },
    },
    {
      id: 'guarded',
      label: '锁定 (始终禁用)',
      disabled: () => true,
      onClick: () => undefined,
    },
  ],
}));
function onColumnHeaderMenuAction(payload: {
  colId: string;
  action: 'sort-asc' | 'sort-desc' | 'clear-sort' | 'hide' | 'autosize';
}): void {
  phase83LastContextAction.value = `${payload.action} on ${payload.colId}`;
}
</script>

<template>
  <main class="demo-page">
    <header class="demo-page__header">
      <h1>@chronixjs/table-vue3</h1>
      <p>
        + 8.1 + 9 + 9.1 + 10 + 10.1 + 11 + 11.1 + 12 + 12.1 + 12.2 + 13 + 14 demo — 50 行 × 6 列 +
        checkbox 选择列 + 分页 + 备注 / 单价列双击编辑 + 表头拖拽改列宽 + 表头拖拽改列序。
        排序：点击表头 (循环 null → 升序 → 降序 → null)，Shift+点击 追加副排序。
        过滤：在表头下方输入框中输入。 字符串列 (名称 / 状态 / 备注) 走 case-insensitive contains
        匹配。 数量 列 (type:'number') 走前缀语法：`5` / `>10` / `<20` / `>=5` / `<=10` / `!=3` /
        `5..50`。 多列输入即 AND 组合；Filter 先于 Sort。 行选择：点击行 单选；Ctrl/Cmd+点击
        多选切换；Shift+点击 范围选择；左侧 checkbox 列 + 表头三态 select-all。 分页：底部 « » +
        可点击页码列表（>7 页时自动 ellipsis）+ 共 X 行 + 每页 select。 编辑：双击 备注 (文本) /
        单价 (数字) 列 cell → 输入 → Enter / Tab / Blur 提交，Esc 取消。 单价 列走 &lt;input
        type="number"&gt; + coerceEditDraftValue — 空输入提交为 null，非数字 (如 `abc`)
        拒提交并保持编辑态。 Tab / Shift+Tab 提交当前 cell 并跨列+跨行自动跳到下一/上一可编辑单元格
        (单价 → 备注 → 下一行单价 → ...)；末尾关闭编辑器；非法输入拒提交时停留原 cell。
        悬浮任意表头列右边缘 4px 区域 → 拖动调整列宽 (实时反馈)；pointerup 提交
        `column-width-change` emit，consumer 回写 columns prop (flex 列变 explicit width，其他 flex
        列继续分配剩余空间)。 状态 列设 `resizable:false`，无 resize 把手。 拖动表头单元格 ≥ 5px
        (Chebyshev) 阈值触发列移动 — 实时 gap-line 落点指示 (落点单元格左/右 半边决定
        before/after)；pointerup 提交并通过 `column-order-change` emit 回写 columns prop
        (`computeColumnReorder` 纯函数处理重排)；状态 列设 `reorderable:false`，不响应拖拽；header
        click 仍触发排序循环 (阈值未跨越)。 **双击表头列右边缘 4px 区域** autosize 列宽到内容
        (Canvas measureText 取每行 + header 最宽 + padding + 限制 min/max)；或调用 imperative
        `autosizeColumn(colId)` / `autosizeAllColumns()`。`column-width-change` emit 与拖拽 resize
        同一渠道；`状态` 列 `resizable:false` 隐式禁用；`备注` 列 `autosizeable:false` 显式 opt-out
        dbl-click 行为 (resizer 仍可拖)。
        <strong>
          cell 上 pointerdown + drag 选区 → 矩形 cell-range；shift+click 在已有 range 上延伸
          focus；按钮可程序化设定/清空。`cellRangeSelection: 'enabled'` 开启 — 默认 `'none'`
          保留原有 cell-click / row-select / dblclick-edit 行为不变。 矩形内的 cell 带
          `cx-table-cell--in-cell-range` modifier (淡蓝高亮)。
        </strong>
        <strong>
          `pinned: 'left'` (ID + 名称) / `'right'` (备注) 把列粘在 body 的左/右边缘 —
          缩窄窗口或滚动表格时保持可见。`pinnedColsPass` 在 `columnLayoutPass` 之后计算累积偏移；
          per-cell `position: sticky` 在已有 flat 行布局上加位，无 wrapper / 无列重排。 单元格交互
          (cell-click / cell-range / dblclick-edit / 行选高亮) 在 pinned + center 两 zone
          行为完全一致 — 委托事件无视 CSS 定位。两个新主题 token (`pinnedShadowColor` /
          `pinnedZoneBg`) 暴露 boundary 阴影 + zone 背景；左 / 右 boundary cell 自带
          `cx-table-cell--pinned-left-last` / `--pinned-right-first` modifier 供 CSS 钩取。
          selection rail 也 sticky 在同一侧，与 pinned 列并排。
        </strong>
        <strong>
          cell-range 激活时按 Ctrl+C (Mac: Cmd+C) → 复制为 TSV → 写入 `navigator.clipboard` → 粘到
          Excel / Sheets / Notion / VS Code 保留单元格结构。`valueFormatter` 在复制时生效 (例如 数量
          列以 `N 件` 形式输出)。 新增 `cell-range-copy` emit + `copyCellRangeToClipboard()`
          TableHandle 方法，按钮可程序化触发同一路径。
        </strong>
        <strong>
          cell-range 激活时按 Ctrl+V (Mac: Cmd+V) → 从 `navigator.clipboard` 读 TSV → 解析为 2D 网格
          → 映射到选区 (1×1 → fill-all；N×M → clamp-overflow， 多余 paste cell 丢弃，多余 envelope
          cell 保留不变) → 按 `column.type` coerce (数字列空 → null / 非法 → silently skip) →
          `cell-range-paste` emit 一次 carry mutations 数组；consumer 用 Map 批量回写 `rows`。
          `cell-value-change` 的 oldValue/newValue 形状一致，handler 可复用。 试着拷贝几个 cell
          后选另一片区域按 Ctrl+V，或直接点 paste 按钮 — 选区内的 cell 都会按列类型 coerce 后更新。
        </strong>
        <strong>
          cell-range 激活时其右下角出现 8×8 蓝色 drag-fill 小方块。drag 该 handle 向下 / 向右 →
          沿主导轴 axis-lock 扩展选区 (Decision A.1，避免对角 2D 拼接) → pointerup 时 constant-fill
          (modulo copy；Decision B.1，不做算术级数推断) → `cell-range-fill` emit carry mutations
          数组 (与 paste 同形状)，consumer 同样 Map 批量回写。预览期间 fill 区 cells 套虚线
          outline；selection 自动扩到 fill 范围。`fillCellRange(targetCell)` handle 方法 +
          按钮可程序化触发同一路径。
        </strong>
        <strong>
          `enableUndoHistory: true` 启用 undo/redo 栈。 Ctrl+Z (Mac: Cmd+Z) 撤销最新 batch
          (cell-edit / paste / fill 任意 gesture 均自动 record) → SFC fire `history-replay` 携带
          REVERSED mutations → consumer 用 Map 批量回写 (同 paste/fill handler)。 Ctrl+Y /
          Ctrl+Shift+Z 重做 → fire `history-replay` 携带 ORIGINAL mutations。 `undo() / redo() /
          canUndo() / canRedo() / clearHistory() / getHistory() / recordMutationBatch()` 7 个 handle
          方法；`history-change` emit 让外部 UI 跟踪 past/future 长度。 试着双击单元格编辑保存，再
          Ctrl+Z 看撤销；或选区 Ctrl+V 后 Ctrl+Z 一次性回退整批粘贴。
        </strong>
      </p>
      <p class="demo-page__sort-state">当前排序：{{ describeSort(currentSort) }}</p>
      <p class="demo-page__sort-state">{{ describeFilter(currentFilter) }}</p>
      <p class="demo-page__sort-state" data-testid="quick-find-state">
        {{ describeQuickFind(currentQuickFindText, currentQuickFindMatchCount) }}
      </p>
      <p class="demo-page__sort-state">{{ describeSelection(currentSelection) }}</p>
      <p class="demo-page__sort-state">{{ describePage(currentPage, currentPageSize) }}</p>
      <p class="demo-page__sort-state">{{ describeLastEdit(lastEdit) }}</p>
      <p class="demo-page__sort-state">{{ describeLastResize(lastResize) }}</p>
      <p class="demo-page__sort-state">{{ describeLastReorder(lastReorder) }}</p>
      <p class="demo-page__sort-state">{{ describeRange(lastRange) }}</p>
      <p class="demo-page__sort-state">{{ describeCopiedTsv(lastCopiedTsv) }}</p>
      <p class="demo-page__sort-state">{{ describePasteSummary(lastPasteSummary) }}</p>
      <p class="demo-page__sort-state">{{ describeFillSummary(lastFillSummary) }}</p>
      <p class="demo-page__sort-state">{{ describeHistoryState(undoHistoryState) }}</p>
      <p class="demo-page__sort-state">{{ describeHistoryReplay(lastHistoryReplay) }}</p>
      <p class="demo-page__sort-state">{{ describeLastHeaderGroupClick(lastHeaderGroupClick) }}</p>
    </header>
    <section class="demo-page__table">
      <div class="demo-page__autosize-actions">
        <label class="demo-page__inline-toggle">
          Quick-find:
          <input
            type="text"
            data-testid="quick-find-input"
            class="demo-page__quick-find-input"
            placeholder="搜索全表 (跨列 OR)"
            :value="currentQuickFindText"
            @input="onQuickFindInput"
          />
        </label>
        <label class="demo-page__inline-toggle demo-page__advanced-filter">
          高级 filter (DSL):
          <input
            type="text"
            data-testid="advanced-filter-input"
            class="demo-page__advanced-filter-input"
            placeholder='qty > 10 AND name CONTAINS "alpha"'
            :value="advancedFilterText"
            @input="onAdvancedFilterInput"
          />
          <button type="button" @click="onAdvancedFilterApply">应用</button>
          <button type="button" @click="onAdvancedFilterFillExample">示例</button>
          <button type="button" @click="onAdvancedFilterClear">清空</button>
        </label>
        <p
          v-if="advancedFilterErrors.length > 0"
          class="demo-page__advanced-filter-errors"
          data-testid="advanced-filter-errors"
        >
          解析错误:
          <span v-for="(err, i) in advancedFilterErrors" :key="i">
            [pos {{ err.position }}] {{ err.message }};
          </span>
        </p>
        <p v-if="advancedFilterStatus !== ''" class="demo-page__advanced-filter-status">
          {{ advancedFilterStatus }}
        </p>
        <button type="button" @click="onAutosizeAll">全部 autosize</button>
        <button type="button" @click="onAutosizeQty">autosize 数量 列</button>
        <button type="button" @click="onSetCellRange">setCellRange r1/name..r5/price</button>
        <button type="button" @click="onClearCellRange">clearCellRange</button>
        <button type="button" @click="onCopyCellRange">copyCellRangeToClipboard</button>
        <button type="button" @click="onPasteCellRange">pasteCellRangeFromClipboard</button>
        <button type="button" @click="onFillToR10Qty">fillCellRange r1/qty → r10/qty</button>
        <button type="button" :disabled="!canUndoNow" @click="onUndoClick">Undo (Ctrl+Z)</button>
        <button type="button" :disabled="!canRedoNow" @click="onRedoClick">Redo (Ctrl+Y)</button>
        <button type="button" @click="onClearHistoryClick">clearHistory</button>
        <label class="demo-page__inline-toggle">
          <input v-model="enableAutoScroll" type="checkbox" />
          enableKeyboardAutoScroll
        </label>
        <button type="button" @click="onJumpFarActiveCell">setActiveCell r19/qty</button>
        <button type="button" data-testid="csv-export-btn" @click="onExportCsv">Export CSV</button>
        <button
          type="button"
          data-testid="xlsx-export-btn"
          :disabled="xlsxBusy"
          @click="onExportXlsx"
        >
          {{ xlsxBusy ? 'Exporting…' : 'Export XLSX' }}
        </button>
        <button
          type="button"
          data-testid="xlsx-multisheet-btn"
          :disabled="xlsxBusy"
          @click="onExportXlsxMultiSheet"
        >
          {{ xlsxBusy ? 'Exporting…' : 'Export 3-sheet XLSX' }}
        </button>
        <span v-if="xlsxError" data-testid="xlsx-error">{{ xlsxError }}</span>
        <button type="button" data-testid="save-view-btn" @click="onSaveView">Save view</button>
        <button type="button" data-testid="load-view-btn" @click="onLoadView">Load view</button>
        <span v-if="savedViewStatus" data-testid="saved-view-status">{{ savedViewStatus }}</span>
      </div>
      <ChronixTable
        ref="table"
        :show-status-bar="true"
        :columns="columns"
        :rows="rows"
        :show-filter-row="true"
        :show-footer-row="true"
        :show-column-visibility-menu="true"
        :show-column-header-menu="true"
        :context-menu="phase83ContextMenuConfig"
        @column-header-menu-action="onColumnHeaderMenuAction"
        :enable-keyboard-navigation="true"
        :enable-keyboard-auto-scroll="enableAutoScroll"
        selection-mode="multi"
        :selection-column="{ show: true, side: 'left' }"
        :row-drag-column="{ show: true, side: 'left' }"
        @row-order-change="onRowOrderChange"
        :pagination-enabled="true"
        :initial-page-size="20"
        cell-range-selection="enabled"
        :enable-undo-history="true"
        @column-width-change="onColumnWidthChange"
        @column-order-change="onColumnOrderChange"
        @column-visibility-change="onColumnVisibilityChange"
        @columns-change="onColumnsChange"
        @sort-change="onSortChange"
        @filter-change="onFilterChange"
        @quick-find-text-change="onQuickFindTextChange"
        @selection-change="onSelectionChange"
        @page-change="onPageChange"
        @cell-value-change="onCellValueChange"
        @cell-range-start="onCellRangeStart"
        @cell-range-change="onCellRangeChange"
        @cell-range-stop="onCellRangeStop"
        @cell-range-copy="onCellRangeCopy"
        @cell-range-paste="onCellRangePaste"
        @cell-range-fill="onCellRangeFill"
        @history-replay="onHistoryReplay"
        @history-change="onHistoryChange"
        @header-group-click="onHeaderGroupClick"
      />
    </section>
    <section class="demo-page__table demo-page__tree-table">
      <header class="demo-page__tree-header">
        <h2>Tree data (vue3 baseline)</h2>
        <p>
          File-tree demo with ~85 rows nested 4 levels (project → module → folder → file). 单击
          chevron 展开 / 折叠；activeCell 在 <code>名称</code> 列时: <strong>Enter</strong> /
          <strong>Space</strong> 切换；<strong>ArrowRight</strong> 展开折叠节点；<strong
            >ArrowLeft</strong
          >
          折叠展开节点 (折叠态 + 有父则跳到父行)。 控件: 全展开 / 全折叠 通过 imperative
          <code>expandRow</code> / <code>collapseRow</code> handle 方法。
        </p>
        <div class="demo-page__autosize-actions">
          <button type="button" @click="onTreeExpandAll">全展开</button>
          <button type="button" @click="onTreeCollapseAll">全折叠</button>
          <span class="demo-page__sort-state">当前展开: {{ treeExpandedCount }} 个节点</span>
        </div>
      </header>
      <ChronixTable
        ref="treeTable"
        :columns="treeColumns"
        :rows="treeRows"
        :enable-keyboard-navigation="true"
        :default-expanded-depth="1"
        selection-mode="multi"
        :selection-column="{ show: true, side: 'left' }"
        @expanded-change="onTreeExpandedChange"
      />
    </section>
    <section class="demo-page__table demo-page__tier2-table" data-testid="tier2-section">
      <header>
        <h2>+ 32 + 33 — Pinned rows + tooltip + overlay</h2>
        <p>
          <strong>Pinned rows</strong>：顶端常驻 ⭐ 行 + 底端 合计 行 (RowSpec.pinned: 'top' /
          'bottom')，不参与排序 / 过滤 / 分页 / 虚拟化。 <strong>Tooltip</strong>：悬停 备注 列
          250ms 出 popover (tooltipField: 'note')。 <strong>Overlay</strong>：loading / 空状态浮层。
        </p>
        <div class="demo-page__autosize-actions">
          <button type="button" data-testid="tier2-loading-toggle" @click="onTier2ToggleLoading">
            {{ tier2Loading ? '停止加载' : '显示 Loading' }}
          </button>
          <button type="button" data-testid="tier2-empty-toggle" @click="onTier2ToggleEmpty">
            {{ tier2EmptyMode ? '恢复数据' : '清空数据' }}
          </button>
        </div>
      </header>
      <ChronixTable
        :columns="tier2Columns"
        :rows="tier2Rows"
        :loading="tier2Loading"
        data-testid="tier2-table"
      />
    </section>
    <section class="demo-page__table demo-page__lazy-table" data-testid="lazy-section">
      <header>
        <h2>Lazy-load tree children</h2>
        <p>
          <strong>Lazy load</strong>：<code>hasChildren: true</code> + 无 <code>children</code> →
          首次展开调用 <code>childrenLoader</code>；500ms 模拟延迟；<code>lazy-fail-1</code>
          行强制失败。 <strong>Cache</strong>: 加载后缓存，二次展开瞬时。 <strong>Cancel</strong>:
          加载中折叠 → AbortSignal 触发。
        </p>
        <div class="demo-page__autosize-actions">
          <button type="button" data-testid="lazy-invalidate-all" @click="onLazyInvalidateAll">
            Reload All
          </button>
          <span class="demo-page__sort-state">
            start: {{ lazyLoadCounts.start }} / success: {{ lazyLoadCounts.success }} / error:
            {{ lazyLoadCounts.error }}
          </span>
        </div>
      </header>
      <ChronixTable
        ref="lazyTable"
        :columns="lazyColumns"
        :rows="lazyRoots"
        :children-loader="lazyChildrenLoader"
        data-testid="lazy-table"
        @lazy-load-start="onLazyStart"
        @lazy-load-success="onLazySuccess"
        @lazy-load-error="onLazyError"
      />
    </section>
    <section
      class="demo-page__table demo-page__server-side-table"
      data-testid="server-side-section"
    >
      <header>
        <h2>Server-side row model</h2>
        <p>
          <strong>Mock server</strong>: 250 rows fetched in blocks with 500ms latency per request.
          <strong>Skeleton rows</strong>: unloaded indices render shimmer bars; virtualization
          computes the full Y range from the server-reported <code>totalRowCount</code>.
          <strong>Sort / filter</strong>: change triggers <code>applyView</code> → in-flight blocks
          abort via <code>AbortSignal</code> → fresh dispatch. <strong>pagination</strong>: toggle
          ON → <code>pageSize</code> (25) becomes the effective <code>cacheBlockSize</code>, page N
          maps 1:1 to block N, the body renders only the current page's slice.
          <strong>invalidate</strong>: <code>invalidateServerSideBlocks([0])</code> returns block 0
          to IDLE state; <code>totalRowCount</code> + other blocks + sort/filter are PRESERVED
          (contrast with <code>refreshServerSideRows()</code> = whole-cache nuke).
          <strong>Toggle</strong>: switch to <code>clientSide</code> mode to compare against the
          same column set without server-side wiring.
        </p>
        <div class="demo-page__autosize-actions">
          <button type="button" data-testid="server-side-toggle" @click="onToggleRowModelType">
            模式: {{ rowModelType === 'serverSide' ? 'server-side' : 'client-side' }} (点击切换)
          </button>
          <button type="button" data-testid="server-side-refresh" @click="onRefreshServerSide">
            Refresh
          </button>
          <button
            type="button"
            data-testid="server-side-pagination-toggle"
            @click="onToggleServerSidePagination"
          >
            Pagination: {{ serverSidePaginationEnabled ? 'ON' : 'OFF' }}
          </button>
          <button
            type="button"
            data-testid="server-side-invalidate-block-0"
            @click="onInvalidateServerSideBlock0"
          >
            invalidateServerSideBlocks([0])
          </button>
        </div>
      </header>
      <ChronixTable
        ref="serverSideTable"
        data-testid="server-side-table"
        :columns="serverSideColumns"
        :rows="[]"
        :row-model-type="rowModelType"
        :server-side-data-source="mockServerSideDataSource"
        :pagination-enabled="serverSidePaginationEnabled"
        :initial-page-size="25"
        :show-filter-row="true"
      />
    </section>
    <section
      class="demo-page__table demo-page__tier3-finale-table"
      data-testid="tier3-finale-section"
    >
      <header>
        <h2>Tier 3 finale (Row number + Actions + Row auto-height)</h2>
        <p>
          <strong>Row number</strong>: <code>ColumnSpec.rowNumber: true</code> pinned-left auto
          renders <code>1, 2, 3</code>. <strong>Actions</strong>:
          <code>ColumnSpec.actions</code> renders 编辑 + 删除 buttons; <code>task-2</code> 's 删除
          is disabled via <code>disabled?(row)</code>. <strong>Row auto-height</strong>:
          <code>enableRowAutoHeight: true</code> + <code>wrapText: true</code> on 说明 column lets
          multi-line rows grow to fit content.
        </p>
        <div class="demo-page__autosize-actions">
          <span class="demo-page__sort-state" data-testid="tier3-edit-count">
            编辑点击次数: {{ tier3LastEditCount }}
          </span>
          <span class="demo-page__sort-state" data-testid="tier3-delete-count">
            删除点击次数: {{ tier3LastDeleteCount }}
          </span>
        </div>
      </header>
      <ChronixTable
        data-testid="tier3-finale-table"
        :columns="tier3Columns"
        :rows="tier3Rows"
        :enable-row-auto-height="true"
      />
    </section>
    <section class="demo-page__table demo-page__tool-panel-table" data-testid="tool-panel-section">
      <header>
        <h2>Tool-panel container (chronix-NEW)</h2>
        <p>
          <strong>chronix-NEW container</strong>: replaces reference's sidebar with a composable
          descriptor-array API. <strong>2 panels</strong>: Info (live row/column count) + Help
          (keyboard shortcuts). <strong>Resizable</strong>: drag the inner edge of the rail to widen
          / narrow. <strong>Toggleable</strong>: click the active icon to collapse the content area;
          rail stays visible.
        </p>
        <div class="demo-page__autosize-actions">
          <span class="demo-page__sort-state" data-testid="tool-panel-width">
            Container width: {{ toolPanelLastWidth }}px
          </span>
        </div>
      </header>
      <ChronixTable
        data-testid="tool-panel-table"
        :columns="columns"
        :rows="rows"
        :tool-panel="toolPanelConfig"
        @tool-panel-width-change="onToolPanelWidthChange"
      />
    </section>
  </main>
</template>
