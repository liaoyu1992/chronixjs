import {
  ChronixColumnsToolPanel,
  ChronixFiltersToolPanel,
  ChronixTable,
  type ContextMenuConfig,
  type ContextMenuContext,
  computeColumnReorder,
  computeRowReorder,
  type GetRowsParams,
  type GetRowsResult,
  type ServerSideDataSource,
  type ToolPanelConfig,
  type CellClickPayload,
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
  type RowOrderChangePayload,
  type ColumnVisibilityChangePayload,
  type ColumnSpec,
  type ColumnWidthChangePayload,
  type EmptyAreaClickPayload,
  type FilterChangePayload,
  type FilterExpression,
  type FilterSpec,
  type MultiFilterEntry,
  type ParseFilterExpressionError,
  type HeaderClickPayload,
  type PageChangePayload,
  type RowDblclickPayload,
  type RowSpec,
  type SelectionChangePayload,
  type SortChangePayload,
  type SortSpec,
  type TableHandle,
} from '@chronixjs/table-react';
import { useCallback, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from 'react';

const STATUS_CLASS_MAP: Readonly<Record<string, string>> = {
  完成: 'cx-status--done',
  进行中: 'cx-status--wip',
  阻塞: 'cx-status--blocked',
  计划: 'cx-status--planned',
};

const initialColumns: readonly ColumnSpec[] = [
  // (2026-05-26 — react port of vue3): id + name
  // pinned left → stay glued to the body's left edge during
  // horizontal scroll.
  // (2026-05-27 — react port of vue3): id + name
  // share `headerGroup: '基础信息'`; qty + price share `headerGroup:
  // '财务'`. status + note stay un-grouped so the empty-placeholder
  // branch is visible. Mirrors the vue3 demo column shape.
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
    // (vue3): type:'number' wires the filter
    // input to parsePrefixNumberFilter for prefix syntax (`>10`,
    // `5..50`, `!=3`, etc).
    type: 'number',
    // (vue3): valueFormatter prepends a unit label
    // for body cells AND footer cells (the SFC routes aggregator
    // output through the same formatter).
    valueFormatter: ({ value }) => `${typeof value === 'number' ? value : 0} 件`,
    // (2026-05-27 — react port): nested path form — qty +
    // price under 财务 > 订单 (level 0 = 财务 spans both; level 1 =
    // 订单 spans both). id+name stay on string shortcut form.
    headerGroup: ['财务', '订单'],
    // (2026-05-27 — react port of vue3): sum
    // aggregator over filtered rows; the sticky footer renders the
    // sum through the same valueFormatter as body cells (reads
    // "N 件").
    aggregator: (rs) =>
      rs.reduce((s, r) => s + (typeof r.data['qty'] === 'number' ? r.data['qty'] : 0), 0),
    // (2026-05-29 — react demo): per-column body-cell xlsx
    // style. Bold right-aligned numeric format with thousands
    // separator. Header preserves bold default.
    exportStyle: {
      font: { bold: true },
      alignment: { horizontal: 'right' },
      numberFormat: '#,##0',
    },
  },
  {
    id: 'price',
    field: 'price',
    headerName: '单价',
    width: 110,
    // (vue3): type:'number' + editable:true wires
    // the in-cell editor to <input type="number"> + coerceEditDraftValue
    // so commits produce typed `number | null` values.
    type: 'number',
    editable: true,
    headerGroup: ['财务', '订单'],
    // average-price aggregator returning a pre-formatted
    // string ("均价 X.XX"). Body cells (no valueFormatter) keep the
    // raw numeric; footer surfaces the formatted average instead.
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
    // (vue3): state-driven cellClass for color coding.
    cellClass: ({ value }) => STATUS_CLASS_MAP[String(value)] ?? 'cx-status--unknown',
    // (vue3): resizable:false omits the drag-resize
    // affordance; the status column stays a fixed 120px to give
    // affordance verification in the demo.
    resizable: false,
    // (2026-05-26 — react port of vue3): reorderable
    // :false alongside resizable:false to keep the status column
    // non-interactive (cursor: pointer for sort, no drag-to-reorder).
    reorderable: false,
    // (2026-05-29 — react port): opt INTO the set-filter
    // dropdown UI. Renders a <details> checkbox list of unique status
    // values in the filter row instead of the text input.
    filterUi: 'set',
  },
  {
    id: 'note',
    field: 'note',
    headerName: '备注',
    flex: 2,
    minWidth: 160,
    // (vue3): editable:true opt-in unlocks dblclick
    // → text editor on this column.
    editable: true,
    // (2026-05-26 — react port of vue3): autosizeable:false
    // explicit opt-out — the resizer still drag-resizes, but dbl-click does
    // NOT autosize. This exercises the opt-OUT path orthogonal to status's
    // resizable:false.
    autosizeable: false,
    // note pinned right → glued to the body's
    // right edge during horizontal scroll.
    pinned: 'right',
  },
  {
    id: 'actions',
    headerName: '操作',
    width: 160,
    pinned: 'right',
    actions: [
      {
        id: 'edit',
        label: '编辑',
        icon: '✏️',
        onClick: () => {
          /* noop */
        },
      },
      {
        id: 'delete',
        label: '删除',
        icon: '🗑',
        onClick: () => {
          /* noop */
        },
      },
    ],
  },
];

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

// (vue3): 50 rows so virtualization actually
// exercises in the demo (totalBodyHeight = 50 × 28 = 1400px;
// viewport ~320px shows ~11 rows + overscan at a time).
// (vue3): paginationEnabled + initialPageSize=20
// reshapes the 50-row dataset into 3 pages × 20 rows + last partial.
// each row carries a `price` field in 0.9..99.5 range
// so the number editor exercises float coercion.
const initialRows: readonly RowSpec[] = Array.from({ length: 50 }, (_, i) => {
  const idx = i + 1;
  return {
    id: `r${idx}`,
    data: {
      id: idx,
      name: NAME_CYCLE[i % NAME_CYCLE.length],
      qty: (idx * 7) % 50,
      price: Math.round(((idx * 13) % 100) * 10) / 10,
      status: STATUS_CYCLE[i % STATUS_CYCLE.length],
      note: NOTE_CYCLE[i % NOTE_CYCLE.length],
    },
  };
});

/**
 * (react port of vue3 2026-05-28): tree-data
 * demo helpers. Mirrors the vue3 demo's file-tree shape.
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

const treeColumns: readonly ColumnSpec[] = [
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
];

function collectParentIds(rows: readonly RowSpec[]): readonly string[] {
  const out: string[] = [];
  const walk = (rs: readonly RowSpec[]): void => {
    for (const row of rs) {
      if (row.children != null && row.children.length > 0) {
        out.push(row.id);
        walk(row.children);
      }
    }
  };
  walk(rows);
  return out;
}

const treeRowsInitial: readonly RowSpec[] = makeFileTree();

export function App(): ReactElement {
  // (vue3): demo state for 4 representative
  // callback handlers — cell-click + header-click + row-dblclick +
  // empty-area-click. Each pill displays the last fired payload so
  // the user can verify all 8 callback props wire correctly.
  const [lastCellClick, setLastCellClick] = useState<string>('');
  const [lastHeaderClick, setLastHeaderClick] = useState<string>('');
  const [lastRowDblclick, setLastRowDblclick] = useState<string>('');
  const [lastEmptyAreaClick, setLastEmptyAreaClick] = useState<string>('');
  // + 49.1 (vue3 + 8.1): track the current sort
  // state as an array for multi-column display.
  const [currentSort, setCurrentSort] = useState<readonly SortSpec[]>([]);
  // (vue3): track the current filter state.
  const [currentFilter, setCurrentFilter] = useState<readonly FilterSpec[]>([]);
  // (2026-05-29 — react port of vue3): track the
  // current quick-find needle + match count for the on-screen status pill.
  const [currentQuickFindText, setCurrentQuickFindText] = useState<string>('');
  const [currentQuickFindMatchCount, setCurrentQuickFindMatchCount] = useState<number>(0);
  // advanced-filter DSL state.
  const [advancedFilterText, setAdvancedFilterText] = useState<string>('');
  const [advancedFilterErrors, setAdvancedFilterErrors] = useState<
    readonly ParseFilterExpressionError[]
  >([]);
  const [advancedFilterStatus, setAdvancedFilterStatus] = useState<string>('');
  // (vue3): track the current selection.
  const [currentSelection, setCurrentSelection] = useState<readonly string[]>([]);
  // (vue3): track the current (page, pageSize)
  // tuple. Useful for the "X / Y" pill below the table.
  const [currentPage, setCurrentPage] = useState<PageChangePayload>({ page: 0, pageSize: 20 });
  // (vue3): mirror committed cell values back into
  // a stateful row array so the next render shows the persisted
  // edit. Mirrors vue3 demo's onCellValueChange pattern.
  const [rows, setRows] = useState<readonly RowSpec[]>(initialRows);
  const [lastEdit, setLastEdit] = useState<string>('');
  // (vue3): mirror committed column widths back
  // into a stateful columns array so the next render shows the
  // persisted resize. Decision B.1 — when a flex column is resized,
  // the consumer rebuilds the column omitting `flex` so other flex
  // columns continue to share the remaining space proportionally.
  const [columns, setColumns] = useState<readonly ColumnSpec[]>(initialColumns);
  const [lastResize, setLastResize] = useState<string>('');
  // (2026-05-26 — react port of vue3): mirror
  // committed column reorders back into the stateful columns array
  // via the pure `computeColumnReorder` helper. Decision A.1 — emit-
  // only persistence; chronix-table-react doesn't mutate the columns
  // prop.
  const [lastReorder, setLastReorder] = useState<string>('');
  // (2026-05-26 — react port of vue3): TableHandle ref
  // for the imperative autosize API. dbl-click resizer triggers
  // autosize natively from the SFC; the demo buttons cover the programmatic
  // single-column + autosize-all paths.
  const tableRef = useRef<TableHandle>(null);
  function onAutosizeAll(): void {
    tableRef.current?.autosizeAllColumns();
  }
  function onAutosizeQty(): void {
    tableRef.current?.autosizeColumn('qty');
  }
  // (2026-05-26 — react port of vue3): cell-range state
  // for the demo pill + 2 imperative buttons.
  const [lastRange, setLastRange] = useState<string>('');
  function onCellRangeStart(payload: CellRangeStartPayload): void {
    const { anchor, focus } = payload.range;
    setLastRange(`start: ${anchor.rowId}/${anchor.colId} → ${focus.rowId}/${focus.colId}`);
  }
  function onCellRangeChange(payload: CellRangeChangePayload): void {
    const { anchor, focus } = payload.range;
    const { rowIds, colIds } = payload.envelope;
    setLastRange(
      `${anchor.rowId}/${anchor.colId} → ${focus.rowId}/${focus.colId} (${rowIds.length}×${colIds.length} = ${rowIds.length * colIds.length} cells)`,
    );
  }
  function onCellRangeStop(payload: CellRangeStopPayload): void {
    const { anchor, focus } = payload.range;
    const { rowIds, colIds } = payload.envelope;
    setLastRange(
      `committed — ${anchor.rowId}/${anchor.colId} → ${focus.rowId}/${focus.colId} (${rowIds.length}×${colIds.length} = ${rowIds.length * colIds.length} cells)`,
    );
  }
  function onSetCellRange(): void {
    tableRef.current?.setCellRange({
      anchor: { rowId: 'r1', colId: 'name' },
      focus: { rowId: 'r5', colId: 'price' },
    });
  }
  function onClearCellRange(): void {
    tableRef.current?.clearCellRange();
  }
  function describeRange(s: string): string {
    return s === ''
      ? '未选 cell-range (在 cell 上 pointerdown + drag 选区；shift+click 延伸；按钮可程序化设定/清空)'
      : `最近 cell-range: ${s}`;
  }

  // (2026-05-27 — react port of vue3): clipboard copy
  // demo state. Shows the first 80 chars of the most-recently-copied
  // TSV; visualizes `\t` as `→` and `\n` as `⏎` so the pill renders
  // legibly without wrapping. Both the Ctrl+C keyboard path AND the
  // programmatic button path flow through `onCellRangeCopy`.
  const [lastCopiedTsv, setLastCopiedTsv] = useState<string>('');
  function onCellRangeCopy(payload: CellRangeCopyPayload): void {
    setLastCopiedTsv(payload.text);
  }
  function describeCopiedTsv(s: string): string {
    if (s === '') {
      return '未复制 cell-range (cell-range 激活后按 Ctrl+C / Cmd+C → 复制为 TSV → 粘到 Excel / Sheets / Notion)';
    }
    const head = s.length > 80 ? `${s.slice(0, 80)}…` : s;
    const visualized = head.replaceAll('\t', '→').replaceAll('\n', ' ⏎ ');
    return `最近复制 (${s.length} chars): ${visualized}`;
  }
  function onCopyCellRange(): void {
    void tableRef.current?.copyCellRangeToClipboard();
  }

  // (2026-05-27 — react port of vue3): clipboard paste
  // demo state. Mutations applied to rows via Map-keyed lookup over
  // visible columns. Pill shows count + first 3 mutations.
  const [lastPasteSummary, setLastPasteSummary] = useState<string>('');
  function describePasteSummary(s: string): string {
    return s === ''
      ? '未粘贴 cell-range (cell-range 激活后按 Ctrl+V / Cmd+V → 粘贴 TSV 到选区；按钮也可程序化触发)'
      : `最近粘贴 mutations: ${s}`;
  }
  function onCellRangePaste(payload: CellRangePastePayload): void {
    if (payload.mutations.length === 0) {
      setLastPasteSummary('0 mutations (paste 无变化 / 全 no-op / 全 reject)');
      return;
    }
    const byKey = new Map<string, unknown>();
    for (const m of payload.mutations) {
      byKey.set(`${m.rowId}/${m.colId}`, m.newValue);
    }
    setRows((prev) =>
      prev.map((row) => {
        let nextData: Record<string, unknown> | null = null;
        for (const col of columns) {
          const key = `${row.id}/${col.id}`;
          if (!byKey.has(key)) continue;
          nextData ??= { ...row.data };
          const field = col.field ?? col.id;
          nextData[field] = byKey.get(key);
        }
        return nextData == null ? row : { ...row, data: nextData };
      }),
    );
    const sample = payload.mutations
      .slice(0, 3)
      .map((m) => `${m.rowId}/${m.colId}=${String(m.newValue)}`)
      .join(', ');
    const more = payload.mutations.length > 3 ? ` (+${payload.mutations.length - 3} 更多)` : '';
    setLastPasteSummary(`${payload.mutations.length} cells: ${sample}${more}`);
  }
  function onPasteCellRange(): void {
    void tableRef.current?.pasteCellRangeFromClipboard();
  }

  // (2026-05-27 — react port of vue3): drag-fill
  // demo state. Same shape as paste handler — mutations are
  // applied via Map-keyed lookup; pill shows count + first 3.
  const [lastFillSummary, setLastFillSummary] = useState<string>('');
  function describeFillSummary(s: string): string {
    return s === ''
      ? '未触发 drag-fill (cell-range 激活后 drag 右下角小方块 → 沿主导轴方向 axis-lock 填充；按钮也可程序化触发)'
      : `最近 fill mutations: ${s}`;
  }
  function onCellRangeFill(payload: CellRangeFillPayload): void {
    if (payload.mutations.length === 0) {
      setLastFillSummary('0 mutations (fill 无变化 / 全 no-op)');
      return;
    }
    const byKey = new Map<string, unknown>();
    for (const m of payload.mutations) {
      byKey.set(`${m.rowId}/${m.colId}`, m.newValue);
    }
    setRows((prev) =>
      prev.map((row) => {
        let nextData: Record<string, unknown> | null = null;
        for (const col of columns) {
          const key = `${row.id}/${col.id}`;
          if (!byKey.has(key)) continue;
          nextData ??= { ...row.data };
          const field = col.field ?? col.id;
          nextData[field] = byKey.get(key);
        }
        return nextData == null ? row : { ...row, data: nextData };
      }),
    );
    const sample = payload.mutations
      .slice(0, 3)
      .map((m) => `${m.rowId}/${m.colId}=${String(m.newValue)}`)
      .join(', ');
    const more = payload.mutations.length > 3 ? ` (+${payload.mutations.length - 3} 更多)` : '';
    setLastFillSummary(`${payload.mutations.length} cells: ${sample}${more}`);
  }
  function onFillToR10Qty(): void {
    const handle = tableRef.current;
    if (handle == null) return;
    handle.setCellRange({
      anchor: { rowId: 'r1', colId: 'qty' },
      focus: { rowId: 'r1', colId: 'qty' },
    });
    handle.fillCellRange({ rowId: 'r10', colId: 'qty' });
  }

  // (2026-05-27 — react port of vue3): undo/redo
  // demo state. Mirrors the SFC's internal mutation-history state into
  // a useState (driven by onHistoryChange) so the Undo/Redo button
  // disabled state stays current. onHistoryReplay applies the
  // (already-reversed for undo / original for redo) mutations via
  // Map-keyed batch-apply — same shape as paste +
  // fill handlers.
  const [undoHistoryState, setUndoHistoryState] = useState<MutationHistoryState>({
    past: [],
    future: [],
  });
  const [lastHistoryReplay, setLastHistoryReplay] = useState<string>('');
  const canUndoNow = undoHistoryState.past.length > 0;
  const canRedoNow = undoHistoryState.future.length > 0;
  function describeUndoHistoryState(s: MutationHistoryState): string {
    return `undo stack: past=${s.past.length} future=${s.future.length} (Ctrl+Z/Y or buttons)`;
  }
  function describeHistoryReplay(s: string): string {
    return s === '' ? '未触发 undo/redo' : `最近 history-replay: ${s}`;
  }
  function onHistoryChange(payload: HistoryChangePayload): void {
    setUndoHistoryState(payload.history);
  }
  function onHistoryReplay(payload: HistoryReplayPayload): void {
    const byKey = new Map<string, unknown>();
    for (const m of payload.batch.mutations) {
      byKey.set(`${m.rowId}/${m.colId}`, m.newValue);
    }
    setRows((prev) =>
      prev.map((row) => {
        let nextData: Record<string, unknown> | null = null;
        for (const col of columns) {
          const key = `${row.id}/${col.id}`;
          if (!byKey.has(key)) continue;
          nextData ??= { ...row.data };
          const field = col.field ?? col.id;
          nextData[field] = byKey.get(key);
        }
        return nextData == null ? row : { ...row, data: nextData };
      }),
    );
    const sample = payload.batch.mutations
      .slice(0, 3)
      .map((m) => `${m.rowId}/${m.colId}=${String(m.newValue)}`)
      .join(', ');
    const more =
      payload.batch.mutations.length > 3 ? ` (+${payload.batch.mutations.length - 3} 更多)` : '';
    setLastHistoryReplay(
      `${payload.direction} (${payload.batch.source}) ${payload.batch.mutations.length} cells: ${sample}${more}`,
    );
  }
  function onUndoClick(): void {
    tableRef.current?.undo();
  }
  function onRedoClick(): void {
    tableRef.current?.redo();
  }
  function onClearHistoryClick(): void {
    tableRef.current?.clearHistory();
  }

  // (2026-05-28 — react port of vue3): opt-out toggle
  // for keyboard auto-scroll. Default ON; flipping OFF lets the user
  // verify the active outline persists on a cell scrolled out of view.
  const [enableAutoScroll, setEnableAutoScroll] = useState<boolean>(true);
  function onExportCsv(): void {
    tableRef.current?.exportToCsv('chronix-table-demo.csv', { rowSource: 'filtered' });
  }

  // (2026-05-29 — react port): xlsx export demo handler.
  const [xlsxBusy, setXlsxBusy] = useState<boolean>(false);
  const [xlsxError, setXlsxError] = useState<string>('');
  async function onExportXlsx(): Promise<void> {
    if (xlsxBusy) return;
    setXlsxBusy(true);
    setXlsxError('');
    try {
      await tableRef.current?.exportToXlsx('chronix-table-demo.xlsx', {
        rowSource: 'filtered',
        xlsxOptions: { sheetName: 'Chronix Demo' },
      });
    } catch (err) {
      setXlsxError(err instanceof Error ? err.message : String(err));
    } finally {
      setXlsxBusy(false);
    }
  }

  // (2026-05-29 — react port): multi-sheet xlsx demo.
  async function onExportXlsxMultiSheet(): Promise<void> {
    if (xlsxBusy) return;
    setXlsxBusy(true);
    setXlsxError('');
    try {
      await tableRef.current?.exportToXlsxMultiSheet('chronix-table-multi-sheet.xlsx', [
        // (2026-05-29 — react port): demo per-sheet freeze-pane.
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
      setXlsxError(err instanceof Error ? err.message : String(err));
    } finally {
      setXlsxBusy(false);
    }
  }

  // (2026-05-29 — react port of vue3): saved-views
  // demo. localStorage round-trip + onColumnsChange atomic rebuild.
  const SAVED_VIEW_KEY = 'chronix-table-react-demo-saved-view';
  const [savedViewStatus, setSavedViewStatus] = useState<string>('');
  function onSaveView(): void {
    const view = tableRef.current?.getTableView();
    if (view == null) return;
    localStorage.setItem(SAVED_VIEW_KEY, JSON.stringify(view));
    setSavedViewStatus(
      `saved (${view.columns.length} cols, sort=${view.sort.length}, filter=${view.filter.length})`,
    );
  }
  function onLoadView(): void {
    const raw = localStorage.getItem(SAVED_VIEW_KEY);
    if (raw == null) {
      setSavedViewStatus('no saved view');
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { version: number };
      tableRef.current?.applyTableView(parsed as never);
      setSavedViewStatus('loaded');
    } catch (err) {
      setSavedViewStatus(`parse error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  function onColumnsChange(payload: { columns: readonly ColumnSpec[]; reason: string }): void {
    // atomic prop rebuild on applyTableView.
    setColumns(payload.columns);
  }
  function onJumpFarActiveCell(): void {
    // r19 is the last row on page 1 (page size = 20) so it's
    // definitely below the visible viewport; `qty` is a center (non-
    // pinned) column.
    tableRef.current?.setActiveCell('r19', 'qty');
  }

  // (react port, 2026-05-28): tree-data demo state +
  // handlers. Mirrors the vue3 demo's file-tree section.
  const treeTableRef = useRef<TableHandle>(null);
  const [treeExpandedCount, setTreeExpandedCount] = useState<number>(0);
  function onTreeExpandedChange(payload: { readonly next: readonly string[] }): void {
    setTreeExpandedCount(payload.next.length);
  }
  function onTreeExpandAll(): void {
    const parents = collectParentIds(treeRowsInitial);
    for (const id of parents) treeTableRef.current?.expandRow(id);
  }
  function onTreeCollapseAll(): void {
    const parents = collectParentIds(treeRowsInitial);
    for (const id of parents) treeTableRef.current?.collapseRow(id);
  }

  // + 32 + 33 demo (2026-05-28): pinned rows + tooltip + overlay.
  const [tier2Loading, setTier2Loading] = useState(false);
  const [tier2EmptyMode, setTier2EmptyMode] = useState(false);
  const tier2Columns = useMemo<readonly ColumnSpec[]>(
    () => [
      { id: 'name', field: 'name', headerName: '名称', flex: 2 },
      { id: 'qty', field: 'qty', headerName: '数量', type: 'number', width: 80 },
      { id: 'price', field: 'price', headerName: '单价', type: 'number', width: 100 },
      { id: 'status', field: 'status', headerName: '状态', width: 120 },
      { id: 'note', field: 'note', headerName: '备注', flex: 1, tooltipField: 'note' },
    ],
    [],
  );
  // demo (2026-05-28 — react port): lazy-load tree children.
  const lazyRoots = useMemo<readonly RowSpec[]>(
    () => [
      { id: 'lazy-folder-a', data: { name: '📁 folder-a', size: '—' }, hasChildren: true },
      { id: 'lazy-folder-b', data: { name: '📁 folder-b', size: '—' }, hasChildren: true },
      { id: 'lazy-fail-1', data: { name: '⚠ folder-fails', size: '—' }, hasChildren: true },
      { id: 'lazy-leaf-1', data: { name: '📄 leaf-1.txt', size: '12 KB' } },
    ],
    [],
  );
  const lazyColumns = useMemo<readonly ColumnSpec[]>(
    () => [
      { id: 'name', field: 'name', headerName: '名称', flex: 2, treeColumn: true },
      { id: 'size', field: 'size', headerName: '大小', width: 100 },
    ],
    [],
  );
  const [lazyLoadCounts, setLazyLoadCounts] = useState({ start: 0, success: 0, error: 0 });
  const lazyTableRef = useRef<TableHandle | null>(null);
  const lazyChildrenLoader = (args: {
    readonly parent: RowSpec;
    readonly signal: AbortSignal;
  }): Promise<readonly RowSpec[]> => {
    const { parent, signal } = args;
    return new Promise<readonly RowSpec[]>((resolve, reject) => {
      const t = setTimeout(() => {
        if (parent.id === 'lazy-fail-1') {
          reject(new Error('synthetic load failure'));
          return;
        }
        resolve([
          {
            id: `${parent.id}/child-1`,
            data: { name: `📄 ${parent.id}/child-1.ts`, size: '4 KB' },
          },
          {
            id: `${parent.id}/child-2`,
            data: { name: `📄 ${parent.id}/child-2.ts`, size: '8 KB' },
          },
          {
            id: `${parent.id}/nested`,
            data: { name: `📁 ${parent.id}/nested`, size: '—' },
            hasChildren: true,
          },
        ]);
      }, 500);
      signal.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  };
  const onLazyStart = (): void => {
    setLazyLoadCounts((p) => ({ ...p, start: p.start + 1 }));
  };
  const onLazySuccess = (): void => {
    setLazyLoadCounts((p) => ({ ...p, success: p.success + 1 }));
  };
  const onLazyError = (): void => {
    setLazyLoadCounts((p) => ({ ...p, error: p.error + 1 }));
  };
  const onLazyInvalidateAll = (): void => {
    lazyTableRef.current?.invalidateLazyChildren();
  };

  // (2026-05-29 — react port): server-side row model demo.
  const [rowModelType, setRowModelType] = useState<'clientSide' | 'serverSide'>('serverSide');
  const serverSideTableRef = useRef<TableHandle | null>(null);
  const serverSideColumns = useMemo<readonly ColumnSpec[]>(
    () => [
      { id: 'id', field: 'id', headerName: 'ID', width: 80 },
      { id: 'name', field: 'name', headerName: '名称', flex: 1 },
      { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
      { id: 'price', field: 'price', headerName: '价格', width: 120 },
      { id: 'status', field: 'status', headerName: '状态', width: 100 },
      { id: 'note', field: 'note', headerName: '备注', width: 120 },
    ],
    [],
  );
  const mockServerSideDataSource = useMemo<ServerSideDataSource>(() => {
    const TOTAL = 250;
    function buildRow(i: number): RowSpec {
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
    return {
      getRows(params: GetRowsParams): Promise<GetRowsResult> {
        return new Promise<GetRowsResult>((resolve, reject) => {
          const h = setTimeout(() => {
            const slice: RowSpec[] = [];
            const end = Math.min(params.endRow, TOTAL);
            for (let i = params.startRow; i < end; i++) slice.push(buildRow(i));
            resolve({ rows: slice, totalRowCount: TOTAL });
          }, 500);
          params.signal.addEventListener('abort', () => {
            clearTimeout(h);
            reject(new Error('aborted'));
          });
        });
      },
    };
  }, []);
  const onToggleRowModelType = (): void => {
    setRowModelType((prev) => (prev === 'serverSide' ? 'clientSide' : 'serverSide'));
  };
  const onRefreshServerSide = (): void => {
    serverSideTableRef.current?.refreshServerSideRows();
  };
  // (2026-05-30 — react port) demo wiring: paginationEnabled toggle.
  const [serverSidePaginationEnabled, setServerSidePaginationEnabled] = useState(false);
  const onToggleServerSidePagination = (): void => {
    setServerSidePaginationEnabled((prev) => !prev);
  };
  // (2026-05-30 — react port) demo wiring: invalidate block 0 only.
  const onInvalidateServerSideBlock0 = (): void => {
    serverSideTableRef.current?.invalidateServerSideBlocks([0]);
  };

  // (2026-05-30 — react port): Tier 3 finale demo data + handlers.
  const [tier3Counter, setTier3Counter] = useState<Record<string, number>>({});
  const tier3Rows = useMemo<readonly RowSpec[]>(
    () => [
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
    ],
    [],
  );
  const tier3Columns = useMemo<readonly ColumnSpec[]>(
    () => [
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
            onClick: (row) =>
              setTier3Counter((prev) => ({
                ...prev,
                [`${row.id}/edit`]: (prev[`${row.id}/edit`] ?? 0) + 1,
              })),
          },
          {
            id: 'delete',
            label: '删除',
            icon: '🗑',
            disabled: (row: RowSpec) => row.data['protected'] === true,
            onClick: (row: RowSpec) =>
              setTier3Counter((prev) => ({
                ...prev,
                [`${row.id}/delete`]: (prev[`${row.id}/delete`] ?? 0) + 1,
              })),
          },
        ],
      },
    ],
    [],
  );
  const tier3LastEditCount = Object.entries(tier3Counter)
    .filter(([k]) => k.endsWith('/edit'))
    .reduce((s, [, v]) => s + v, 0);
  const tier3LastDeleteCount = Object.entries(tier3Counter)
    .filter(([k]) => k.endsWith('/delete'))
    .reduce((s, [, v]) => s + v, 0);

  // Tool-panel popover demo. A settings icon in the
  // action column header opens a floating popover hosting 4 panels
  // (Info + Columns + Filters + Help). Renderers close over reactive
  // state (rows.length, selection count) so the panels stay in
  // sync with the table.
  const toolPanelConfig = useMemo<ToolPanelConfig>(
    () => ({
      show: true,
      initialOpenId: 'info',
      popoverWidth: 320,
      panels: [
        {
          id: 'info',
          label: 'Info',
          icon: 'ⓘ',
          renderer: () => (
            <div className="demo-tool-panel-body">
              <h4>表格信息</h4>
              <p>行数: {rows.length}</p>
              <p>列数: {columns.length}</p>
              <p className="demo-tool-panel-hint">点击设置图标打开面板,点击外部关闭。</p>
            </div>
          ),
        },
        {
          id: 'columns',
          label: 'Columns',
          icon: '⛶',
          renderer: () => (
            <ChronixColumnsToolPanel tableHandle={tableRef.current} columns={columns} />
          ),
        },
        {
          id: 'filters',
          label: 'Filters',
          icon: '⛁',
          renderer: () => (
            <ChronixFiltersToolPanel
              tableHandle={tableRef.current}
              columns={columns}
              filterSpec={currentFilter}
            />
          ),
        },
        {
          id: 'help',
          label: 'Help',
          icon: '?',
          renderer: () => (
            <div className="demo-tool-panel-body">
              <h4>快捷键</h4>
              <ul>
                <li>Ctrl+Z / Ctrl+Y — 撤销 / 重做</li>
                <li>Shift+Click — 范围选择</li>
                <li>Enter — 进入编辑</li>
              </ul>
            </div>
          ),
        },
      ],
    }),
    [rows.length, columns, currentFilter],
  );

  // (2026-05-30 — react port): context menu + header menu wiring.
  const [phase83LastContextAction, setPhase83LastContextAction] = useState('—');
  const phase83ContextMenuConfig: ContextMenuConfig = useMemo(
    () => ({
      items: [
        {
          id: 'copy-cell',
          label: '复制单元格',
          icon: '📋',
          onClick: (ctx: ContextMenuContext): void => {
            setPhase83LastContextAction(`复制 ${ctx.rowId ?? '?'}/${ctx.colId ?? '?'}`);
          },
        },
        {
          id: 'inspect',
          label: '查看单元格信息',
          icon: 'ℹ️',
          onClick: (ctx: ContextMenuContext): void => {
            setPhase83LastContextAction(`查看 ${ctx.rowId ?? '?'}/${ctx.colId ?? '?'}`);
          },
        },
        {
          id: 'guarded',
          label: '锁定 (始终禁用)',
          disabled: (): boolean => true,
          onClick: (): void => undefined,
        },
      ],
    }),
    [],
  );
  const onColumnHeaderMenuAction = useCallback(
    (payload: {
      colId: string;
      action: 'sort-asc' | 'sort-desc' | 'clear-sort' | 'hide' | 'autosize';
    }): void => {
      setPhase83LastContextAction(`${payload.action} on ${payload.colId}`);
    },
    [],
  );
  void phase83LastContextAction;

  const tier2Rows = useMemo<readonly RowSpec[]>(() => {
    if (tier2EmptyMode) return [];
    const base: readonly RowSpec[] = rows.slice(0, 12);
    if (base.length === 0) return base;
    const pinnedTop: RowSpec = {
      id: 'pinned-top-summary',
      data: {
        name: '⭐ 置顶汇总',
        qty: '—',
        price: '—',
        status: 'TOP',
        note: '本表顶端常驻汇总行',
      },
      pinned: 'top',
    };
    let sumQty = 0;
    let sumPrice = 0;
    for (const r of base) {
      const q = r.data['qty'];
      if (typeof q === 'number') sumQty += q;
      const p = r.data['price'];
      if (typeof p === 'number') sumPrice += p;
    }
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
    const out: readonly RowSpec[] = [pinnedTop, ...base, pinnedBottom];
    return out;
  }, [rows, tier2EmptyMode]);

  // (2026-05-27 — react port of vue3): demo state +
  // handler for `onHeaderGroupClick`. Empty placeholder cells never
  // fire (no `data-group-name` attr to resolve) — this only updates
  // on labelled group cells.
  const [lastHeaderGroupClick, setLastHeaderGroupClick] = useState<string>('');
  function describeLastHeaderGroupClick(s: string): string {
    return s === '' ? '未触发 header-group-click' : `最近 header-group-click: ${s}`;
  }
  function onHeaderGroupClick(payload: HeaderGroupClickPayload): void {
    setLastHeaderGroupClick(
      `${payload.groupName} (${payload.colIds.length} cols: ${payload.colIds.join(', ')})`,
    );
  }

  function onCellClick(payload: CellClickPayload): void {
    setLastCellClick(`${payload.row.id} / ${payload.column.id} = ${String(payload.value)}`);
  }
  function onHeaderClick(payload: HeaderClickPayload): void {
    setLastHeaderClick(`${payload.column.headerName ?? payload.column.id}`);
  }
  function onRowDblclick(payload: RowDblclickPayload): void {
    setLastRowDblclick(`${payload.row.id}`);
  }
  function onEmptyAreaClick(_payload: EmptyAreaClickPayload): void {
    setLastEmptyAreaClick(`${new Date().toLocaleTimeString()}`);
  }
  function onSortChange(payload: SortChangePayload): void {
    setCurrentSort(payload.sortSpec);
  }
  function onFilterChange(payload: FilterChangePayload): void {
    setCurrentFilter(payload.filterSpec);
  }
  // (2026-05-29 — react port): track the current quick-find
  // needle + read the match count off the imperative handle once the
  // pass has settled.
  function onQuickFindTextChange(payload: { quickFindText: string }): void {
    setCurrentQuickFindText(payload.quickFindText);
    void Promise.resolve().then(() => {
      setCurrentQuickFindMatchCount(tableRef.current?.getQuickFindMatchCount() ?? 0);
    });
  }
  function onQuickFindInput(ev: ChangeEvent<HTMLInputElement>): void {
    tableRef.current?.setQuickFindText(ev.target.value);
  }
  // (react port): advanced-filter DSL input handlers.
  function onAdvancedFilterInput(ev: ChangeEvent<HTMLInputElement>): void {
    setAdvancedFilterText(ev.target.value);
  }
  function onAdvancedFilterApply(): void {
    const handle = tableRef.current;
    if (handle == null) return;
    const result = handle.parseAndSetAdvancedFilter(advancedFilterText);
    if (result.ok) {
      setAdvancedFilterErrors([]);
      setAdvancedFilterStatus(result.expression == null ? '已清空 (输入为空)' : '已应用表达式');
    } else {
      setAdvancedFilterErrors(result.errors);
      setAdvancedFilterStatus(`解析失败 (${result.errors.length} 错误)`);
    }
  }
  function onAdvancedFilterClear(): void {
    const handle = tableRef.current;
    if (handle == null) return;
    handle.setAdvancedFilter(null);
    setAdvancedFilterText('');
    setAdvancedFilterErrors([]);
    setAdvancedFilterStatus('已清空');
  }
  function onAdvancedFilterFillExample(): void {
    setAdvancedFilterText('qty >= 10 AND status = "完成"');
    setAdvancedFilterStatus('示例已填入,点击 应用 生效');
  }
  // Silence unused-binding for FilterExpression type-only import.
  type _Phase42Imports = FilterExpression;
  function onSelectionChange(payload: SelectionChangePayload): void {
    setCurrentSelection(payload.selectedRowIds);
  }
  function onPageChange(payload: PageChangePayload): void {
    setCurrentPage(payload);
  }
  function onCellValueChange(payload: CellValueChangePayload): void {
    // Mirror the committed value into the persistent rows array so
    // subsequent renders show the edit. Mutating row.data
    // immutably (clone + set) preserves the array's reference
    // semantics expected by chronix-table-react.
    setRows((prev) =>
      prev.map((row) =>
        row.id === payload.row.id
          ? {
              ...row,
              data: { ...row.data, [payload.column.field ?? payload.column.id]: payload.newValue },
            }
          : row,
      ),
    );
    setLastEdit(
      `${payload.row.id} / ${payload.column.id}: ${String(payload.oldValue)} → ${String(payload.newValue)}`,
    );
  }
  function onColumnOrderChange(payload: ColumnOrderChangePayload): void {
    setColumns((prev) =>
      computeColumnReorder(prev, payload.movedColumn.id, payload.targetColumn.id, payload.position),
    );
    const movedLabel = payload.movedColumn.headerName ?? payload.movedColumn.id;
    const targetLabel = payload.targetColumn.headerName ?? payload.targetColumn.id;
    const positionLabel = payload.position === 'before' ? '前' : '后';
    setLastReorder(`${movedLabel} → ${targetLabel} 之${positionLabel}`);
  }
  // (2026-05-29 — react port): row drag emit-only persistence.
  function onRowOrderChange(payload: RowOrderChangePayload): void {
    setRows((prev) =>
      computeRowReorder(prev, payload.movedRow.id, payload.targetRow.id, payload.position),
    );
  }
  // (2026-05-27 — react port of vue3): consume the
  // column-visibility callback + rebuild columns with the new `hide`
  // value per Decision A.1 (emit-only persistence).
  const [lastVisibilityChange, setLastVisibilityChange] = useState<string>('');
  function onColumnVisibilityChange(payload: ColumnVisibilityChangePayload): void {
    setColumns((prev) =>
      prev.map((c) => (c.id === payload.column.id ? { ...c, hide: payload.hidden } : c)),
    );
    const label = payload.column.headerName ?? payload.column.id;
    setLastVisibilityChange(`${label} → ${payload.hidden ? '隐藏' : '显示'}`);
  }
  void lastVisibilityChange;
  function onColumnWidthChange(payload: ColumnWidthChangePayload): void {
    // Decision B.1: mirror committed widths back into the
    // stateful columns array; destructure-omit `flex` on the resized
    // column so it converts from flex-share to explicit-width and
    // other flex columns continue sharing the remainder proportionally.
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id !== payload.column.id) return col;
        const { flex: _omittedFlex, ...rest } = col;
        return { ...rest, width: payload.newWidth };
      }),
    );
    setLastResize(
      `${payload.column.id}: ${String(payload.oldWidth)}px → ${String(payload.newWidth)}px`,
    );
  }

  function describeCellClick(s: string): string {
    return s === '' ? '未点击 cell (点击任意 cell)' : `最近 cell-click: ${s}`;
  }
  function describeHeaderClick(s: string): string {
    return s === '' ? '未点击表头 (点击任意表头列)' : `最近 header-click: ${s}`;
  }
  function describeRowDblclick(s: string): string {
    return s === ''
      ? '未双击行 (双击任意行 — 备注/单价 列会进入编辑模式)'
      : `最近 row-dblclick: ${s}`;
  }
  function describeEmptyAreaClick(s: string): string {
    return s === '' ? '未点击空白区 (滚动到最后一行下方点击)' : `最近 empty-area-click: ${s}`;
  }
  function describeSort(specs: readonly SortSpec[]): string {
    if (specs.length === 0) return '未排序 (点击表头切换；Shift+点击 追加列)';
    const parts = specs.map((spec) => {
      const col = columns.find((c) => c.id === spec.colId);
      const label = col?.headerName ?? spec.colId;
      return `「${label}」${spec.direction === 'asc' ? '升序 ▲' : '降序 ▼'}`;
    });
    return `按 ${parts.join(' + ')}`;
  }
  function describeFilter(specs: readonly FilterSpec[]): string {
    if (specs.length === 0) return '无过滤 (在表头下方输入框中输入)';
    const parts = specs.map((spec) => {
      if (spec.type === 'expression') {
        return `表达式: ${spec.source ?? '(IR-only)'}`;
      }
      const col = columns.find((c) => c.id === spec.colId);
      const label = col?.headerName ?? spec.colId;
      if (spec.type === 'set') {
        const values = spec.selectedValues;
        if (values == null) return `「${label}」全选`;
        if (values.length === 0) return `「${label}」空选`;
        const display = values
          .slice(0, 3)
          .map((v: string | number | boolean | null) => (v === null ? '(空)' : String(v)))
          .join(', ');
        const more = values.length > 3 ? `, …+${values.length - 3}` : '';
        return `「${label}」∈ {${display}${more}}`;
      }
      if (spec.type === 'text') return `「${label}」包含 "${spec.value}"`;
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
    return `已过滤: ${parts.join(' AND ')}`;
  }
  function describeQuickFind(text: string, count: number): string {
    if (text === '') return '无 quick-find (输入框为空)';
    return `quick-find "${text}" → ${count} 行匹配`;
  }
  function describeSelection(ids: readonly string[]): string {
    if (ids.length === 0) return '未选择行 (点击/勾选；Ctrl/Cmd+点击 多选切换；Shift+点击 范围)';
    if (ids.length <= 5) return `已选 ${ids.length} 行: ${ids.join(', ')}`;
    return `已选 ${ids.length} 行: ${ids.slice(0, 5).join(', ')} 等`;
  }
  function describePage(p: PageChangePayload): string {
    return `第 ${p.page + 1} 页 (每页 ${p.pageSize} 行)`;
  }
  function describeEdit(s: string): string {
    return s === ''
      ? '未编辑 (双击 备注 / 单价 列开启编辑；Enter / Tab / Blur 提交；Esc 取消；Tab 自动跳到下一个 editable 列 + 跨行；Shift+Tab 反向；非法数字 reject-and-keep)'
      : `最近 cell-value-change: ${s}`;
  }
  function describeResize(s: string): string {
    return s === ''
      ? '未调整列宽 (鼠标悬停表头右边缘 4px 拖拽；状态 列 resizable:false 已禁用)'
      : `最近 column-width-change: ${s}`;
  }
  function describeReorder(s: string): string {
    return s === ''
      ? '未拖拽列序 (拖动表头单元格 ≥ 5px → 落点 gap-line 显示；状态 列 reorderable:false 已禁用)'
      : `最近 column-order-change: ${s}`;
  }

  return (
    <div className="demo-app">
      <aside className="demo-app-sidebar">
        <header className="demo-page__header">
          <h1>@chronixjs/table-react</h1>
          <p className="demo-page__sort-state">当前排序: {describeSort(currentSort)}</p>
          <p className="demo-page__sort-state">{describeFilter(currentFilter)}</p>
          <p className="demo-page__sort-state" data-testid="quick-find-state">
            {describeQuickFind(currentQuickFindText, currentQuickFindMatchCount)}
          </p>
          <p className="demo-page__sort-state">{describeSelection(currentSelection)}</p>
          <p className="demo-page__sort-state">当前分页: {describePage(currentPage)}</p>
          <p className="demo-page__sort-state">{describeEdit(lastEdit)}</p>
          <p className="demo-page__sort-state">{describeResize(lastResize)}</p>
          <p className="demo-page__sort-state">{describeReorder(lastReorder)}</p>
          <p className="demo-page__sort-state">{describeRange(lastRange)}</p>
          <p className="demo-page__sort-state">{describeCopiedTsv(lastCopiedTsv)}</p>
          <p className="demo-page__sort-state">{describePasteSummary(lastPasteSummary)}</p>
          <p className="demo-page__sort-state">{describeFillSummary(lastFillSummary)}</p>
          <p className="demo-page__sort-state">{describeUndoHistoryState(undoHistoryState)}</p>
          <p className="demo-page__sort-state">{describeHistoryReplay(lastHistoryReplay)}</p>
          <p className="demo-page__sort-state">
            {describeLastHeaderGroupClick(lastHeaderGroupClick)}
          </p>
          <p className="demo-page__sort-state">{describeCellClick(lastCellClick)}</p>
          <p className="demo-page__sort-state">{describeHeaderClick(lastHeaderClick)}</p>
          <p className="demo-page__sort-state">{describeRowDblclick(lastRowDblclick)}</p>
          <p className="demo-page__sort-state">{describeEmptyAreaClick(lastEmptyAreaClick)}</p>
          <div className="demo-page__autosize-actions">
            <label className="demo-page__inline-toggle">
              Quick-find:
              <input
                type="text"
                data-testid="quick-find-input"
                className="demo-page__quick-find-input"
                placeholder="搜索全表 (跨列 OR)"
                value={currentQuickFindText}
                onChange={onQuickFindInput}
              />
            </label>
            <label className="demo-page__inline-toggle demo-page__advanced-filter">
              高级 filter (DSL):
              <input
                type="text"
                data-testid="advanced-filter-input"
                className="demo-page__advanced-filter-input"
                placeholder='qty > 10 AND name CONTAINS "alpha"'
                value={advancedFilterText}
                onChange={onAdvancedFilterInput}
              />
              <button type="button" onClick={onAdvancedFilterApply}>
                应用
              </button>
              <button type="button" onClick={onAdvancedFilterFillExample}>
                示例
              </button>
              <button type="button" onClick={onAdvancedFilterClear}>
                清空
              </button>
            </label>
            {advancedFilterErrors.length > 0 && (
              <p className="demo-page__advanced-filter-errors" data-testid="advanced-filter-errors">
                解析错误:{' '}
                {advancedFilterErrors.map((err, i) => (
                  <span key={i}>
                    [pos {err.position}] {err.message};{' '}
                  </span>
                ))}
              </p>
            )}
            {advancedFilterStatus !== '' && (
              <p className="demo-page__advanced-filter-status">{advancedFilterStatus}</p>
            )}
            <button type="button" onClick={onAutosizeAll}>
              全部 autosize
            </button>
            <button type="button" onClick={onAutosizeQty}>
              autosize 数量 列
            </button>
            <button type="button" onClick={onSetCellRange}>
              setCellRange r1/name..r5/price
            </button>
            <button type="button" onClick={onClearCellRange}>
              clearCellRange
            </button>
            <button type="button" onClick={onCopyCellRange}>
              copyCellRangeToClipboard
            </button>
            <button type="button" onClick={onPasteCellRange}>
              pasteCellRangeFromClipboard
            </button>
            <button type="button" onClick={onFillToR10Qty}>
              fillCellRange r1/qty → r10/qty
            </button>
            <button type="button" disabled={!canUndoNow} onClick={onUndoClick}>
              Undo (Ctrl+Z)
            </button>
            <button type="button" disabled={!canRedoNow} onClick={onRedoClick}>
              Redo (Ctrl+Y)
            </button>
            <button type="button" onClick={onClearHistoryClick}>
              clearHistory
            </button>
            <label className="demo-page__inline-toggle">
              <input
                type="checkbox"
                checked={enableAutoScroll}
                onChange={(e) => setEnableAutoScroll(e.target.checked)}
              />
              enableKeyboardAutoScroll
            </label>
            <button type="button" onClick={onJumpFarActiveCell}>
              setActiveCell r19/qty
            </button>
            <button type="button" data-testid="csv-export-btn" onClick={onExportCsv}>
              Export CSV
            </button>
            <button
              type="button"
              data-testid="xlsx-export-btn"
              disabled={xlsxBusy}
              onClick={() => {
                void onExportXlsx();
              }}
            >
              {xlsxBusy ? 'Exporting…' : 'Export XLSX'}
            </button>
            <button
              type="button"
              data-testid="xlsx-multisheet-btn"
              disabled={xlsxBusy}
              onClick={() => {
                void onExportXlsxMultiSheet();
              }}
            >
              {xlsxBusy ? 'Exporting…' : 'Export 3-sheet XLSX'}
            </button>
            {xlsxError && <span data-testid="xlsx-error">{xlsxError}</span>}
            <button type="button" data-testid="save-view-btn" onClick={onSaveView}>
              Save view
            </button>
            <button type="button" data-testid="load-view-btn" onClick={onLoadView}>
              Load view
            </button>
            {savedViewStatus && <span data-testid="saved-view-status">{savedViewStatus}</span>}
          </div>
        </header>
      </aside>
      <main className="demo-app-main">
        <section className="demo-page__table">
          <ChronixTable
            ref={tableRef}
            showStatusBar
            columns={columns}
            rows={rows}
            showFilterRow
            showFooterRow
            showColumnVisibilityMenu
            showColumnHeaderMenu
            contextMenu={phase83ContextMenuConfig}
            onColumnHeaderMenuAction={onColumnHeaderMenuAction}
            enableKeyboardNavigation
            enableKeyboardAutoScroll={enableAutoScroll}
            selectionMode="multi"
            selectionColumn={{ show: true, side: 'left' }}
            paginationEnabled
            initialPageSize={20}
            cellRangeSelection="enabled"
            enableUndoHistory={true}
            onCellClick={onCellClick}
            onHeaderClick={onHeaderClick}
            onRowDblclick={onRowDblclick}
            onEmptyAreaClick={onEmptyAreaClick}
            onSortChange={onSortChange}
            onFilterChange={onFilterChange}
            onQuickFindTextChange={onQuickFindTextChange}
            onSelectionChange={onSelectionChange}
            onPageChange={onPageChange}
            onCellValueChange={onCellValueChange}
            onColumnWidthChange={onColumnWidthChange}
            onColumnOrderChange={onColumnOrderChange}
            rowDragColumn={{ show: true, side: 'left' }}
            onRowOrderChange={onRowOrderChange}
            onColumnVisibilityChange={onColumnVisibilityChange}
            onColumnsChange={onColumnsChange}
            onCellRangeStart={onCellRangeStart}
            onCellRangeChange={onCellRangeChange}
            onCellRangeStop={onCellRangeStop}
            onCellRangeCopy={onCellRangeCopy}
            onCellRangePaste={onCellRangePaste}
            onCellRangeFill={onCellRangeFill}
            onHistoryReplay={onHistoryReplay}
            onHistoryChange={onHistoryChange}
            onHeaderGroupClick={onHeaderGroupClick}
          />
        </section>
        <section className="demo-page__table demo-page__tree-table">
          <header className="demo-page__tree-header">
            <h2>Tree data (react port)</h2>
            <p>
              File-tree demo: ~85 行 nested 4 levels (project → module → folder → file). 单击
              chevron 切换展开 / 折叠；activeCell 在 <code>名称</code> 列时 <strong>Enter</strong> /{' '}
              <strong>Space</strong> 切换；<strong>ArrowRight</strong> 展开折叠节点；
              <strong>ArrowLeft</strong> 折叠展开节点 (折叠态 + 有父则跳到父行)。
            </p>
            <div className="demo-page__autosize-actions">
              <button type="button" onClick={onTreeExpandAll}>
                全展开
              </button>
              <button type="button" onClick={onTreeCollapseAll}>
                全折叠
              </button>
              <span className="demo-page__sort-state">当前展开: {treeExpandedCount} 个节点</span>
            </div>
          </header>
          <ChronixTable
            ref={treeTableRef}
            columns={treeColumns}
            rows={treeRowsInitial}
            enableKeyboardNavigation
            defaultExpandedDepth={1}
            selectionMode="multi"
            selectionColumn={{ show: true, side: 'left' }}
            onExpandedChange={onTreeExpandedChange}
          />
        </section>
        <section className="demo-page__table demo-page__tier2-table" data-testid="tier2-section">
          <header>
            <h2>+ 32 + 33 — Pinned rows + tooltip + overlay</h2>
            <p>
              <strong>Pinned rows</strong>: ⭐ top + 合计 bottom (RowSpec.pinned), never
              sort/filter/paginate.
              <strong> Tooltip</strong>: hover 备注 column 250ms.
              <strong> Overlay</strong>: loading / no-rows toggle.
            </p>
            <div className="demo-page__autosize-actions">
              <button
                type="button"
                data-testid="tier2-loading-toggle"
                onClick={() => {
                  setTier2Loading((v) => !v);
                }}
              >
                {tier2Loading ? '停止加载' : '显示 Loading'}
              </button>
              <button
                type="button"
                data-testid="tier2-empty-toggle"
                onClick={() => {
                  setTier2EmptyMode((v) => !v);
                }}
              >
                {tier2EmptyMode ? '恢复数据' : '清空数据'}
              </button>
            </div>
          </header>
          <ChronixTable
            columns={tier2Columns}
            rows={tier2Rows}
            loading={tier2Loading}
            data-testid="tier2-table"
          />
        </section>
        <section className="demo-page__table demo-page__lazy-table" data-testid="lazy-section">
          <header>
            <h2>Lazy-load tree children</h2>
            <p>
              <strong>Lazy load</strong>: <code>hasChildren: true</code> → first expand calls
              <code>childrenLoader</code>; 500ms simulated latency; <code>lazy-fail-1</code>
              always rejects + retry on error icon click.
            </p>
            <div className="demo-page__autosize-actions">
              <button type="button" data-testid="lazy-invalidate-all" onClick={onLazyInvalidateAll}>
                Reload All
              </button>
              <span className="demo-page__sort-state">
                start: {lazyLoadCounts.start} / success: {lazyLoadCounts.success} / error:{' '}
                {lazyLoadCounts.error}
              </span>
            </div>
          </header>
          <ChronixTable
            ref={lazyTableRef}
            columns={lazyColumns}
            rows={lazyRoots}
            childrenLoader={lazyChildrenLoader}
            onLazyLoadStart={onLazyStart}
            onLazyLoadSuccess={onLazySuccess}
            onLazyLoadError={onLazyError}
            data-testid="lazy-table"
          />
        </section>
        <section
          className="demo-page__table demo-page__server-side-table"
          data-testid="server-side-section"
        >
          <header>
            <h2>Server-side row model (react)</h2>
            <p>
              <strong>Mock server</strong>: 250 rows fetched in blocks with 500ms latency per
              request.
              <strong>Skeleton rows</strong>: unloaded indices render shimmer bars.
              <strong>pagination</strong>: toggle ON → <code>pageSize</code> (25) becomes block
              size, body renders only current page slice. <strong>invalidate</strong>: block 0 only
              — preserves <code>totalRowCount</code> + other blocks (contrast with whole-cache{' '}
              <code>Refresh</code>). <strong>Toggle</strong>: switch to <code>clientSide</code> mode
              to compare.
            </p>
            <div className="demo-page__autosize-actions">
              <button type="button" data-testid="server-side-toggle" onClick={onToggleRowModelType}>
                模式: {rowModelType === 'serverSide' ? 'server-side' : 'client-side'} (点击切换)
              </button>
              <button type="button" data-testid="server-side-refresh" onClick={onRefreshServerSide}>
                Refresh
              </button>
              <button
                type="button"
                data-testid="server-side-pagination-toggle"
                onClick={onToggleServerSidePagination}
              >
                Pagination: {serverSidePaginationEnabled ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                data-testid="server-side-invalidate-block-0"
                onClick={onInvalidateServerSideBlock0}
              >
                invalidateServerSideBlocks([0])
              </button>
            </div>
          </header>
          <ChronixTable
            ref={serverSideTableRef}
            columns={serverSideColumns}
            rows={[]}
            rowModelType={rowModelType}
            serverSideDataSource={mockServerSideDataSource}
            paginationEnabled={serverSidePaginationEnabled}
            initialPageSize={25}
            showFilterRow
            data-testid="server-side-table"
          />
        </section>
        <section
          className="demo-page__table demo-page__tier3-finale-table"
          data-testid="tier3-finale-section"
        >
          <header>
            <h2>Tier 3 finale (react — row number + actions + auto-height)</h2>
            <p>
              <strong>Row number</strong>: <code>ColumnSpec.rowNumber: true</code>.
              <strong>Actions</strong>: <code>ColumnSpec.actions</code>; <code>task-2</code>&apos;s
              删除 is disabled. <strong>Row auto-height</strong>:
              <code>enableRowAutoHeight: true</code> + <code>wrapText: true</code>.
            </p>
            <div className="demo-page__autosize-actions">
              <span className="demo-page__sort-state" data-testid="tier3-edit-count">
                编辑点击次数: {tier3LastEditCount}
              </span>
              <span className="demo-page__sort-state" data-testid="tier3-delete-count">
                删除点击次数: {tier3LastDeleteCount}
              </span>
            </div>
          </header>
          <ChronixTable
            columns={tier3Columns}
            rows={tier3Rows}
            enableRowAutoHeight
            data-testid="tier3-finale-table"
          />
        </section>
        <section
          className="demo-page__table demo-page__tool-panel-table"
          data-testid="tool-panel-section"
        >
          <header>
            <h2>Tool-panel popover (chronix-NEW)</h2>
            <p>
              <strong>chronix-NEW popover</strong>: a settings (⚙) icon in the action column header
              opens a floating popover. <strong>4 panels</strong>: Info (live row/column count),
              Columns (visibility toggler), Filters (advanced filter DSL), + Help (keyboard
              shortcuts). <strong>Toggleable</strong>: click the icon to open/close; click outside
              or press Escape to dismiss.
            </p>
          </header>
          <ChronixTable
            columns={columns}
            rows={rows}
            toolPanel={toolPanelConfig}
            data-testid="tool-panel-table"
          />
        </section>
      </main>
    </div>
  );
}
