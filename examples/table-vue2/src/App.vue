<script lang="ts">
import {
  ChronixColumnsToolPanel,
  ChronixFiltersToolPanel,
  ChronixTable,
  type ContextMenuConfig,
  computeColumnReorder,
  computeRowReorder,
  type GetRowsParams,
  type GetRowsResult,
  type ServerSideDataSource,
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
  type FilterChangePayload,
  type FilterSpec,
  type MultiFilterEntry,
  type PageChangePayload,
  type RowSpec,
  type SelectionChangePayload,
  type SortChangePayload,
  type TableHandle,
  type ToolPanelConfig,
} from '@chronixjs/table-vue2';
import { defineComponent, h } from 'vue';

// status → CSS modifier class mapping for
// the status column's cellClass function. Mirrors vue3 demo verbatim.
const STATUS_CLASS_MAP: Record<string, string> = {
  完成: 'cx-status--done',
  进行中: 'cx-status--wip',
  阻塞: 'cx-status--blocked',
  计划: 'cx-status--planned',
};

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
const STATUS_CYCLE = ['计划', '进行中', '完成', '阻塞'] as const;
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

// columns moved into a factory so the consumer
// can mutate the array on `column-width-change` emit (chronix-table
// itself is unopinionated about persistence — consumers own the
// write-back path; matches `rows` conversion pattern).
// INITIAL_COLUMNS retains a module-scope snapshot for label-lookup
// helpers (sortLabel / filterLabel) that don't need to follow live
// width mutations.
function buildInitialColumns(): ColumnSpec[] {
  return [
    // (2026-05-26 — vue2 port of vue3): id + name
    // pinned left → stay glued to the body's left edge during
    // horizontal scroll.
    // (2026-05-27 — vue2 port of vue3): id + name share
    // `headerGroup: '基础信息'`; qty + price share `headerGroup: '财务'`.
    // status + note stay un-grouped so the empty-placeholder branch is
    // visible. Mirrors the vue3 demo column shape.
    {
      id: 'id',
      field: 'id',
      headerName: 'ID',
      width: 80,
      minWidth: 40,
      pinned: 'left',
      headerGroup: '基础信息',
    },
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
      // type:'number' wires the filter input
      // to the prefix-syntax parser (parsePrefixNumberFilter) so users
      // can type `5`, `>10`, `<20`, `>=5`, `<=10`, `!=3`, `5..50`.
      type: 'number',
      // valueFormatter prepends a unit label for body
      // cells AND footer cells (the SFC routes the aggregator output
      // through the same formatter).
      valueFormatter: ({ value }) =>
        typeof value === 'number' ? `${value} 件` : `${String(value ?? 0)} 件`,
      // bounded resize range so the drag has
      // verifiable clamp behavior (60..240).
      minWidth: 60,
      maxWidth: 240,
      // (2026-05-27 — vue2 port): nested path form — qty +
      // price under 财务 > 订单. id+name stay on string shortcut form.
      headerGroup: ['财务', '订单'],
      // (2026-05-27 — vue2 port of vue3): sum
      // aggregator over filtered rows. Sticky footer renders the
      // result through the same valueFormatter as body cells.
      aggregator: (rs) =>
        rs.reduce((s, r) => s + (typeof r.data['qty'] === 'number' ? r.data['qty'] : 0), 0),
      // (2026-05-29 — vue2 demo): per-column body-cell xlsx
      // style. Bold right-aligned numeric format. Header row preserves
      // bold default (untouched by exportStyle).
      exportStyle: {
        font: { bold: true },
        alignment: { horizontal: 'right' },
        numberFormat: '#,##0',
      },
    },
    {
      // number-typed editable column. No
      // valueFormatter so the editor opens with the raw numeric
      // string (e.g. "9.9") — `type: 'number'` triggers `<input
      // type="number">` with `inputmode="decimal"` + coerceEditDraftValue
      // runs on commit so `newValue` is a typed number (or `null` for
      // empty input).
      id: 'price',
      field: 'price',
      headerName: '单价',
      width: 110,
      type: 'number',
      editable: true,
      headerGroup: ['财务', '订单'],
      // average-price aggregator returning a pre-formatted
      // string ("均价 X.XX"). Body cells (no valueFormatter) keep the
      // raw numeric; footer surfaces the formatted average instead.
      aggregator: (rs) => {
        const nums = rs
          .map((r) => r.data['price'])
          .filter((v): v is number => typeof v === 'number');
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
      // opt OUT of resize so the user can
      // verify resizable:false suppresses the resizer affordance.
      resizable: false,
      // opt OUT of reorder alongside resize so
      // the status column stays non-interactive — the cursor stays
      // pointer (sort), no drag-to-reorder, no resizer affordance.
      reorderable: false,
      // (2026-05-29 — vue2 port): opt INTO the set-filter
      // dropdown UI. Renders a <details> checkbox list of unique
      // status values in the filter row instead of the text input.
      filterUi: 'set',
    },
    // editable: true opts the column into in-cell
    // editing (双击 → text input → Enter / Tab / Blur 提交，Esc 取消).
    // autosizeable:false explicit opt-out — the
    // resizer still drag-resizes, but dbl-click does NOT autosize. This
    // exercises the opt-OUT path orthogonal to status's resizable:false.
    {
      id: 'note',
      field: 'note',
      headerName: '备注',
      flex: 2,
      minWidth: 160,
      editable: true,
      autosizeable: false,
      // note pinned right → glued to the
      // body's right edge during horizontal scroll.
      pinned: 'right',
    },
    {
      id: 'actions',
      headerName: '操作',
      width: 160,
      pinned: 'right',
      actions: [
        { id: 'edit', label: '编辑', icon: '✏️', onClick: () => {} },
        { id: 'delete', label: '删除', icon: '🗑', onClick: () => {} },
      ],
    },
  ];
}

const INITIAL_COLUMNS: readonly ColumnSpec[] = buildInitialColumns();

// bumped from 10 → 50 rows so pagination is
// visually meaningful with default pageSize=20 → 3 pages.
// moved INTO `data()` so the consumer can
// mutate row data on cell-value-change emit (chronix-table itself is
// unopinionated about persistence — consumers own the write-back path).
function buildInitialRows(): RowSpec[] {
  return Array.from({ length: 50 }, (_, i) => {
    const idx = i + 1;
    return {
      id: `r${idx}`,
      data: {
        id: idx,
        name: NAME_CYCLE[i % NAME_CYCLE.length],
        qty: (idx * 7) % 50,
        // numeric prices spanning 0.9..99.5
        // with one decimal place so the editor exercises float
        // coercion. Verbatim port of vue3 demo formula.
        price: Math.round(((idx * 13) % 100) * 10 + 99) / 10,
        status: STATUS_CYCLE[i % STATUS_CYCLE.length],
        note: NOTE_CYCLE[i % NOTE_CYCLE.length],
      },
    };
  });
}

function sortLabel(sortSpec: SortChangePayload['sortSpec']): string {
  if (sortSpec.length === 0) return '';
  const parts = sortSpec.map((spec) => {
    const column = INITIAL_COLUMNS.find((c) => c.id === spec.colId);
    const label = column?.headerName ?? spec.colId;
    return `「${label}」${spec.direction === 'asc' ? '升序' : '降序'}`;
  });
  return `当前排序：${parts.join(' / ')}`;
}

// filter label — mirrors sortLabel format.
// Multi-spec joins with " AND ". Verbatim port of vue3 demo's
// describeFilter (commit 89b1a3e). extends
// with number-variant formatting: `「数量」 > 25` for simple ops
// + `「数量」∈ [10, 30]` for inRange.
function filterLabel(specs: readonly FilterSpec[]): string {
  if (specs.length === 0) return '';
  const parts = specs.map((spec) => {
    if (spec.type === 'expression') {
      return `表达式：${spec.source ?? '(IR-only)'}`;
    }
    const col = INITIAL_COLUMNS.find((c) => c.id === spec.colId);
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

// selection label — mirrors filter/sort pattern.
// Shows count + first N ids; long selections truncate with 等 suffix.
// Verbatim port of vue3 demo's describeSelection (commit 02b1225).
function selectionLabel(ids: readonly string[]): string {
  if (ids.length === 0) return '未选择行 (点击选；Ctrl/Cmd+点击 多选切换)';
  if (ids.length <= 5) return `已选 ${ids.length} 行: ${ids.join(', ')}`;
  return `已选 ${ids.length} 行: ${ids.slice(0, 5).join(', ')} 等`;
}

// pagination label — mirrors other status pills.
// Renders the human-friendly "第 N / M 页 — 显示 X-Y / Z 行" format
// matching vue3 demo's describePage. The footer inside <ChronixTable>
// renders its own controls; the pill mirrors for visibility +
// demonstrates page-change emit observability.
function pageLabel(page: number, pageSize: number, totalRows: number): string {
  const visibleStart = page * pageSize + 1;
  const visibleEnd = Math.min((page + 1) * pageSize, totalRows);
  const totalPages = Math.max(1, Math.ceil(totalRows / Math.max(1, pageSize)));
  return `第 ${page + 1} / ${totalPages} 页 — 显示 ${visibleStart}-${visibleEnd} / ${totalRows} 行`;
}

/**
 * (vue2 port of vue3 2026-05-28): tree-data
 * demo helpers. Mirrors the vue3 demo's file-tree shape (project →
 * module → folder → file).
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

function buildTreeColumns(): ColumnSpec[] {
  return [
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
      valueFormatter: ({ value }) =>
        typeof value === 'number' ? value.toLocaleString('zh-CN') : '',
    },
    { id: 'modified', field: 'modified', headerName: '修改日期', width: 120 },
  ];
}

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

export default defineComponent({
  name: 'DemoApp',
  components: { ChronixTable },
  data() {
    const initialRows = buildInitialRows();
    return {
      // columns is now mutable so the
      // column-width-change handler can rebuild it per Decision A.1
      // (emit-only persistence — chronix-table does NOT mutate the
      // columns prop).
      columns: buildInitialColumns() as readonly ColumnSpec[],
      rows: initialRows as readonly RowSpec[],
      currentSortLabel: '' as string,
      currentFilterLabel: '' as string,
      // (2026-05-29 — vue2 port): mirrors the current quick-find
      // needle + match count for the on-screen status pill.
      currentQuickFindText: '' as string,
      currentQuickFindMatchCount: 0 as number,
      // advanced-filter DSL state.
      advancedFilterText: '' as string,
      advancedFilterErrors: [] as readonly { message: string; position: number }[],
      advancedFilterStatus: '' as string,
      currentSelectionLabel: selectionLabel([]),
      currentPageLabel: pageLabel(0, 20, initialRows.length),
      // mirrors the last cell commit via
      // cell-value-change emit. Empty until the first commit.
      currentEditLabel: '' as string,
      // mirrors the last column-width-change
      // emit. Empty until the first resize commit.
      currentResizeLabel: '' as string,
      // mirrors the last column-order-change
      // emit. Empty until the first reorder commit.
      currentReorderLabel: '' as string,
      currentVisibilityLabel: '' as string,
      // mirrors the last cell-range envelope.
      // Empty until the first range gesture.
      currentRangeLabel: '' as string,
      // (2026-05-27 — vue2 port of vue3): mirrors the
      // last cell-range-copy TSV. Empty until the first copy gesture
      // (Ctrl+C / Cmd+C on focused body OR programmatic
      // `copyCellRangeToClipboard()` button).
      currentCopiedTsv: '' as string,
      // (2026-05-27 — vue2 port of vue3): mirrors the
      // last cell-range-paste mutation summary. Empty until the first
      // paste gesture.
      currentPasteSummary: '' as string,
      // (2026-05-27 — vue2 port of vue3): mirrors
      // the last cell-range-fill mutation summary. Empty until the
      // first drag-fill gesture (handle drag OR programmatic
      // `fillCellRange()` button).
      currentFillSummary: '' as string,
      // (2026-05-27 — vue2 port of vue3): mirrors
      // the latest mutation-history state for the on-screen pills +
      // button-disabled-state binding. Updated via `onHistoryChange`
      // emit handler.
      currentUndoHistoryState: { past: [], future: [] } as MutationHistoryState,
      // tracks the most-recent history-replay summary for
      // the pill. Updated via `onHistoryReplay` emit handler.
      currentHistoryReplay: '' as string,
      // (2026-05-27 — vue2 port of vue3): last
      // `header-group-click` payload summary for the demo pill.
      currentHeaderGroupClick: '' as string,
      // (2026-05-28 — vue2 port of vue3): opt-out
      // toggle for keyboard auto-scroll. Default ON; flipping OFF lets
      // the user verify the active outline persists on a cell scrolled
      // out of view.
      enableAutoScroll: true,
      // (2026-05-29 — vue2 port of vue3): saved-view
      // status text displayed next to the Save/Load buttons.
      savedViewStatus: '',
      // (2026-05-29 — vue2 port): xlsx export state.
      xlsxBusy: false,
      xlsxError: '',
      // (vue2 port of vue3 2026-05-28): tree
      // data demo state + columns. Mirrors the vue3 demo's file-tree
      // example.
      treeColumns: buildTreeColumns() as readonly ColumnSpec[],
      treeRows: makeFileTree() as readonly RowSpec[],
      treeExpandedCount: 0,
      // + 32 + 33 demo (2026-05-28): pinned rows + tooltip +
      // overlay. Verbatim port of vue3 demo.
      tier2Loading: false,
      tier2EmptyMode: false,
      // demo state.
      lazyRoots: [
        { id: 'lazy-folder-a', data: { name: '📁 folder-a', size: '—' }, hasChildren: true },
        { id: 'lazy-folder-b', data: { name: '📁 folder-b', size: '—' }, hasChildren: true },
        { id: 'lazy-fail-1', data: { name: '⚠ folder-fails', size: '—' }, hasChildren: true },
        { id: 'lazy-leaf-1', data: { name: '📄 leaf-1.txt', size: '12 KB' } },
      ] as readonly RowSpec[],
      lazyColumns: [
        { id: 'name', field: 'name', headerName: '名称', flex: 2, treeColumn: true },
        { id: 'size', field: 'size', headerName: '大小', width: 100 },
      ] as readonly ColumnSpec[],
      lazyLoadCounts: { start: 0, success: 0, error: 0 },
      // (2026-05-29 — vue2 port): server-side row model mode.
      rowModelType: 'serverSide' as 'clientSide' | 'serverSide',
      // (2026-05-30 — vue2 port): showPagination toggle.
      serverSideshowPagination: false as boolean,
      // (2026-05-30 — vue2 port): Tier 3 finale demo data.
      tier3Counter: {} as Record<string, number>,
      // (2026-05-30 — vue2 port): context-menu last-action mirror.
      phase83LastContextAction: '—' as string,
      tier3Rows: [
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
      ] as readonly RowSpec[],
      tier2Columns: [
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
      ] as readonly ColumnSpec[],
    };
  },
  computed: {
    canUndoNow(): boolean {
      return (this.currentUndoHistoryState.past.length ?? 0) > 0;
    },
    serverSideColumns(): readonly ColumnSpec[] {
      return SERVER_SIDE_COLUMNS_VUE2;
    },
    mockServerSideDataSource(): ServerSideDataSource {
      return mockServerSideDataSourceVue2;
    },
    emptyServerSideRows(): readonly RowSpec[] {
      return [];
    },
    phase83ContextMenuConfig(): ContextMenuConfig {
      const self = this as unknown as { phase83LastContextAction: string };
      return {
        items: [
          {
            id: 'copy-cell',
            label: '复制单元格',
            icon: '📋',
            onClick: (ctx) => {
              self.phase83LastContextAction = `复制 ${ctx.rowId}/${ctx.colId}`;
            },
          },
          {
            id: 'inspect',
            label: '查看单元格信息',
            icon: 'ℹ️',
            onClick: (ctx) => {
              self.phase83LastContextAction = `查看 ${ctx.rowId}/${ctx.colId}`;
            },
          },
          {
            id: 'guarded',
            label: '锁定 (始终禁用)',
            disabled: () => true,
            onClick: () => undefined,
          },
        ],
      };
    },
    toolPanelConfig(): ToolPanelConfig {
      const self = this as unknown as {
        rows: readonly RowSpec[];
        columns: readonly ColumnSpec[];
        currentFilter: readonly FilterSpec[];
        $refs: { table?: unknown };
      };
      const getHandle = (): TableHandle | null =>
        (self.$refs.table as unknown as TableHandle | undefined) ?? null;
      return {
        show: true,
        initialOpenId: 'info',
        popoverWidth: 320,
        panels: [
          {
            id: 'info',
            label: 'Info',
            icon: 'ⓘ',
            renderer: () =>
              h('div', { class: 'demo-tool-panel-body' }, [
                h('h4', '表格信息'),
                h('p', `行数: ${self.rows.length}`),
                h('p', `列数: ${self.columns.length}`),
                h('p', { class: 'demo-tool-panel-hint' }, '点击设置图标打开面板,点击外部关闭。'),
              ]),
          },
          {
            id: 'columns',
            label: 'Columns',
            icon: '⛶',
            renderer: () =>
              h(ChronixColumnsToolPanel, {
                props: {
                  tableHandle: getHandle(),
                  columns: self.columns,
                },
              }),
          },
          {
            id: 'filters',
            label: 'Filters',
            icon: '⛁',
            renderer: () =>
              h(ChronixFiltersToolPanel, {
                props: {
                  tableHandle: getHandle(),
                  columns: self.columns,
                  filterSpec: self.currentFilter,
                },
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
      };
    },
    tier3LastEditCount(): number {
      return Object.entries(this.tier3Counter)
        .filter(([k]) => k.endsWith('/edit'))
        .reduce((s, [, v]) => s + (v as number), 0);
    },
    tier3LastDeleteCount(): number {
      return Object.entries(this.tier3Counter)
        .filter(([k]) => k.endsWith('/delete'))
        .reduce((s, [, v]) => s + (v as number), 0);
    },
    tier3Columns(): readonly ColumnSpec[] {
      const self = this as unknown as {
        onTier3EditClick(row: RowSpec): void;
        onTier3DeleteClick(row: RowSpec): void;
      };
      return [
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
              onClick: (row: RowSpec) => self.onTier3EditClick(row),
            },
            {
              id: 'delete',
              label: '删除',
              icon: '🗑',
              disabled: (row: RowSpec) => row.data['protected'] === true,
              onClick: (row: RowSpec) => self.onTier3DeleteClick(row),
            },
          ],
        },
      ];
    },
    canRedoNow(): boolean {
      return (this.currentUndoHistoryState.future.length ?? 0) > 0;
    },
    tier2BaseRows(): readonly RowSpec[] {
      if (this.tier2EmptyMode) return [];
      return this.rows.slice(0, 12);
    },
    tier2Rows(): readonly RowSpec[] {
      const base = this.tier2BaseRows;
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
    },
  },
  methods: {
    onSortChange(payload: SortChangePayload): void {
      this.currentSortLabel = sortLabel(payload.sortSpec);
    },
    onFilterChange(payload: FilterChangePayload): void {
      this.currentFilterLabel = filterLabel(payload.filterSpec);
    },
    // (2026-05-29 — vue2 port): track the current quick-find
    // needle + read the match count off the imperative handle once the
    // pass has settled.
    onQuickFindTextChange(payload: { quickFindText: string }): void {
      this.currentQuickFindText = payload.quickFindText;
      const self = this as unknown as {
        $refs: { table?: { getQuickFindMatchCount(): number } };
        currentQuickFindMatchCount: number;
      };
      void Promise.resolve().then(() => {
        self.currentQuickFindMatchCount = self.$refs.table?.getQuickFindMatchCount() ?? 0;
      });
    },
    onQuickFindInput(ev: Event): void {
      const target = ev.target as HTMLInputElement;
      const self = this as unknown as {
        $refs: { table?: { setQuickFindText(text: string): void } };
      };
      self.$refs.table?.setQuickFindText(target.value);
    },
    // (vue2 port): advanced-filter DSL input handlers.
    onAdvancedFilterInput(ev: Event): void {
      const target = ev.target as HTMLInputElement;
      this.advancedFilterText = target.value;
    },
    onAdvancedFilterApply(): void {
      const self = this as unknown as {
        $refs: {
          table?: {
            parseAndSetAdvancedFilter(text: string): {
              ok: boolean;
              expression?: unknown;
              errors?: readonly { message: string; position: number }[];
            };
          };
        };
        advancedFilterText: string;
        advancedFilterErrors: readonly { message: string; position: number }[];
        advancedFilterStatus: string;
      };
      const handle = self.$refs.table;
      if (handle == null) return;
      const result = handle.parseAndSetAdvancedFilter(self.advancedFilterText);
      if (result.ok) {
        self.advancedFilterErrors = [];
        self.advancedFilterStatus =
          result.expression == null ? '已清空 (输入为空)' : '已应用表达式';
      } else {
        self.advancedFilterErrors = result.errors ?? [];
        self.advancedFilterStatus = `解析失败 (${(result.errors ?? []).length} 错误)`;
      }
    },
    onAdvancedFilterClear(): void {
      const self = this as unknown as {
        $refs: {
          table?: { setAdvancedFilter(expression: unknown, source?: string): void };
        };
        advancedFilterText: string;
        advancedFilterErrors: readonly { message: string; position: number }[];
        advancedFilterStatus: string;
      };
      const handle = self.$refs.table;
      if (handle == null) return;
      handle.setAdvancedFilter(null);
      self.advancedFilterText = '';
      self.advancedFilterErrors = [];
      self.advancedFilterStatus = '已清空';
    },
    onAdvancedFilterFillExample(): void {
      this.advancedFilterText = 'qty >= 10 AND status = "完成"';
      this.advancedFilterStatus = '示例已填入,点击 应用 生效';
    },
    onSelectionChange(payload: SelectionChangePayload): void {
      this.currentSelectionLabel = selectionLabel(payload.selectedRowIds);
    },
    onPageChange(payload: PageChangePayload): void {
      this.currentPageLabel = pageLabel(payload.page, payload.pageSize, this.rows.length);
    },
    // mirror the committed cell value back into
    // `this.rows` (chronix-table doesn't mutate the rows prop on commit;
    // consumers own persistence). Re-assigns `this.rows` to a fresh
    // array so the table picks up the identity change. Also updates the
    // last-edit pill via `currentEditLabel`.
    onCellValueChange(payload: CellValueChangePayload): void {
      const field = payload.column.field ?? payload.column.id;
      this.rows = this.rows.map((row) => {
        if (row.id !== payload.row.id) return row;
        return {
          ...row,
          data: { ...row.data, [field]: payload.newValue },
        };
      });
      this.currentEditLabel = `最近编辑：${payload.row.id} / ${payload.column.id}：「${String(payload.oldValue)}」→「${String(payload.newValue)}」`;
    },
    // mirror the committed column width back
    // into `this.columns` per Decision A.1 (emit-only persistence --
    // chronix-table does NOT mutate the columns prop). Per Decision
    // B.1 "拖谁谁变" -- resizing a flex column converts it to
    // explicit width by destructure-omitting `flex` so other flex
    // columns keep their proportional share of remaining space.
    // The destructure-omit (rather than `flex: undefined`) is required
    // because the package's tsconfig has `exactOptionalPropertyTypes:
    // true`. Matches the SFC's `columnsForLayout` computed pattern.
    onColumnWidthChange(payload: ColumnWidthChangePayload): void {
      this.columns = this.columns.map((c) => {
        if (c.id !== payload.column.id) return c;
        const { flex: _omittedFlex, ...rest } = c;
        return { ...rest, width: payload.newWidth };
      });
      this.currentResizeLabel = `最近列宽：「${payload.column.headerName ?? payload.column.id}」 ${payload.oldWidth}px → ${payload.newWidth}px`;
    },
    // mirror the committed column order back into
    // `this.columns` via `computeColumnReorder` pure helper (Decision
    // A.1 — emit-only persistence; chronix-table doesn't mutate the
    // columns prop). Mirrors vue3 demo handler.
    onColumnOrderChange(payload: ColumnOrderChangePayload): void {
      this.columns = computeColumnReorder(
        this.columns,
        payload.movedColumn.id,
        payload.targetColumn.id,
        payload.position,
      );
      const movedLabel = payload.movedColumn.headerName ?? payload.movedColumn.id;
      const targetLabel = payload.targetColumn.headerName ?? payload.targetColumn.id;
      const positionLabel = payload.position === 'before' ? '前' : '后';
      this.currentReorderLabel = `最近列序：「${movedLabel}」→「${targetLabel}」之${positionLabel}`;
    },
    // (2026-05-29 — vue2 port): row drag — emit-only persistence.
    onRowOrderChange(payload: RowOrderChangePayload): void {
      this.rows = computeRowReorder(
        this.rows,
        payload.movedRow.id,
        payload.targetRow.id,
        payload.position,
      );
    },
    // (2026-05-27 — vue2 port of vue3): consume the
    // column-visibility-change emit + rebuild columns array with the
    // new `hide` value per Decision A.1 (emit-only persistence).
    onColumnVisibilityChange(payload: ColumnVisibilityChangePayload): void {
      this.columns = this.columns.map((c) =>
        c.id === payload.column.id ? { ...c, hide: payload.hidden } : c,
      );
      const label = payload.column.headerName ?? payload.column.id;
      this.currentVisibilityLabel = `最近列显隐：「${label}」→ ${payload.hidden ? '隐藏' : '显示'}`;
    },
    // wire the imperative autosize TableHandle
    // methods to demo buttons. dbl-click resizer triggers
    // autosize natively from the SFC; these buttons cover the
    // programmatic API + the autosize-all batch.
    onAutosizeAll(): void {
      (this.$refs['table'] as unknown as TableHandle | undefined)?.autosizeAllColumns();
    },
    onAutosizeQty(): void {
      (this.$refs['table'] as unknown as TableHandle | undefined)?.autosizeColumn('qty');
    },
    // (2026-05-26 — vue2 port of vue3): cell-range
    // emit handlers mirror envelope into a pill, plus 2 imperative
    // buttons that exercise the setCellRange / clearCellRange handle
    // methods.
    onCellRangeStart(payload: CellRangeStartPayload): void {
      const { anchor, focus } = payload.range;
      this.currentRangeLabel = `start: ${anchor.rowId}/${anchor.colId} → ${focus.rowId}/${focus.colId}`;
    },
    onCellRangeChange(payload: CellRangeChangePayload): void {
      const { anchor, focus } = payload.range;
      const { rowIds, colIds } = payload.envelope;
      this.currentRangeLabel = `${anchor.rowId}/${anchor.colId} → ${focus.rowId}/${focus.colId} (${rowIds.length}×${colIds.length} = ${rowIds.length * colIds.length} cells)`;
    },
    onCellRangeStop(payload: CellRangeStopPayload): void {
      const { anchor, focus } = payload.range;
      const { rowIds, colIds } = payload.envelope;
      this.currentRangeLabel = `committed — ${anchor.rowId}/${anchor.colId} → ${focus.rowId}/${focus.colId} (${rowIds.length}×${colIds.length} = ${rowIds.length * colIds.length} cells)`;
    },
    onSetCellRange(): void {
      (this.$refs['table'] as unknown as TableHandle | undefined)?.setCellRange({
        anchor: { rowId: 'r1', colId: 'name' },
        focus: { rowId: 'r5', colId: 'price' },
      });
    },
    onClearCellRange(): void {
      (this.$refs['table'] as unknown as TableHandle | undefined)?.clearCellRange();
    },
    // (2026-05-27 — vue2 port of vue3): show the
    // last-copied TSV in a pill so the user can confirm the same value
    // landed in the clipboard. Visualizes `\t` as `→` and `\n` as `⏎`
    // so the pill doesn't squish into single-line illegibility.
    onCellRangeCopy(payload: CellRangeCopyPayload): void {
      const head = payload.text.length > 80 ? `${payload.text.slice(0, 80)}…` : payload.text;
      const visualized = head.replaceAll('\t', '→').replaceAll('\n', ' ⏎ ');
      this.currentCopiedTsv = `最近复制 (${payload.text.length} chars): ${visualized}`;
    },
    async onCopyCellRange(): Promise<void> {
      await (this.$refs['table'] as unknown as TableHandle | undefined)?.copyCellRangeToClipboard();
    },
    // (2026-05-27 — vue2 port of vue3): clipboard paste
    // demo handlers. Mirrors mutations into rows via Map lookup.
    onCellRangePaste(payload: CellRangePastePayload): void {
      if (payload.mutations.length === 0) {
        this.currentPasteSummary =
          '最近粘贴 mutations: 0 mutations (paste 无变化 / 全 no-op / 全 reject)';
        return;
      }
      const byKey = new Map<string, unknown>();
      for (const m of payload.mutations) {
        byKey.set(`${m.rowId}/${m.colId}`, m.newValue);
      }
      this.rows = this.rows.map((row) => {
        let nextData: Record<string, unknown> | null = null;
        for (const col of this.columns) {
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
      this.currentPasteSummary = `最近粘贴 mutations: ${payload.mutations.length} cells: ${sample}${more}`;
    },
    async onPasteCellRange(): Promise<void> {
      await (
        this.$refs['table'] as unknown as TableHandle | undefined
      )?.pasteCellRangeFromClipboard();
    },
    // (2026-05-27 — vue2 port of vue3): drag-fill
    // demo handlers. Mirrors mutations into rows via Map lookup (same
    // shape as paste handler).
    onCellRangeFill(payload: CellRangeFillPayload): void {
      if (payload.mutations.length === 0) {
        this.currentFillSummary = '最近 fill mutations: 0 mutations (fill 无变化 / 全 no-op)';
        return;
      }
      const byKey = new Map<string, unknown>();
      for (const m of payload.mutations) {
        byKey.set(`${m.rowId}/${m.colId}`, m.newValue);
      }
      this.rows = this.rows.map((row) => {
        let nextData: Record<string, unknown> | null = null;
        for (const col of this.columns) {
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
      this.currentFillSummary = `最近 fill mutations: ${payload.mutations.length} cells: ${sample}${more}`;
    },
    onFillToR10Qty(): void {
      const handle = this.$refs['table'] as unknown as TableHandle | undefined;
      if (handle == null) return;
      handle.setCellRange({
        anchor: { rowId: 'r1', colId: 'qty' },
        focus: { rowId: 'r1', colId: 'qty' },
      });
      handle.fillCellRange({ rowId: 'r10', colId: 'qty' });
    },
    // (2026-05-27 — vue2 port of vue3): undo/redo
    // demo handlers. `onHistoryChange` mirrors the SFC's internal
    // state into a reactive field for button-disabled bindings;
    // `onHistoryReplay` applies the (already-reversed for undo /
    // original for redo) mutations to `rows` via Map-keyed batch-
    // apply — same shape as paste + fill handlers.
    onHistoryChange(payload: HistoryChangePayload): void {
      this.currentUndoHistoryState = payload.history;
    },
    onHistoryReplay(payload: HistoryReplayPayload): void {
      const byKey = new Map<string, unknown>();
      for (const m of payload.batch.mutations) {
        byKey.set(`${m.rowId}/${m.colId}`, m.newValue);
      }
      this.rows = this.rows.map((row) => {
        let nextData: Record<string, unknown> | null = null;
        for (const col of this.columns) {
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
      this.currentHistoryReplay = `${payload.direction} (${payload.batch.source}) ${payload.batch.mutations.length} cells: ${sample}${more}`;
    },
    onUndoClick(): void {
      (this.$refs['table'] as unknown as TableHandle | undefined)?.undo();
    },
    onRedoClick(): void {
      (this.$refs['table'] as unknown as TableHandle | undefined)?.redo();
    },
    onClearHistoryClick(): void {
      (this.$refs['table'] as unknown as TableHandle | undefined)?.clearHistory();
    },
    onExportCsv(): void {
      const handle = this.$refs['table'] as unknown as TableHandle | undefined;
      handle?.exportToCsv('chronix-table-demo.csv', { rowSource: 'filtered' });
    },
    // (2026-05-29 — vue2 port): multi-sheet xlsx demo.
    async onExportXlsxMultiSheet(): Promise<void> {
      if (this.xlsxBusy) return;
      this.xlsxBusy = true;
      this.xlsxError = '';
      try {
        const handle = this.$refs['table'] as unknown as TableHandle | undefined;
        await handle?.exportToXlsxMultiSheet('chronix-table-multi-sheet.xlsx', [
          // (2026-05-29 — vue2 port): demo per-sheet freeze-pane.
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
        this.xlsxError = err instanceof Error ? err.message : String(err);
      } finally {
        this.xlsxBusy = false;
      }
    },
    // (2026-05-29 — vue2 port): xlsx export demo handler.
    async onExportXlsx(): Promise<void> {
      if (this.xlsxBusy) return;
      this.xlsxBusy = true;
      this.xlsxError = '';
      try {
        const handle = this.$refs['table'] as unknown as TableHandle | undefined;
        await handle?.exportToXlsx('chronix-table-demo.xlsx', {
          rowSource: 'filtered',
          xlsxOptions: { sheetName: 'Chronix Demo' },
        });
      } catch (err) {
        this.xlsxError = err instanceof Error ? err.message : String(err);
      } finally {
        this.xlsxBusy = false;
      }
    },
    // (2026-05-29 — vue2 port of vue3): saved-views
    // demo. localStorage round-trip + onColumnsChange atomic rebuild.
    onSaveView(): void {
      const handle = this.$refs['table'] as unknown as TableHandle | undefined;
      const view = handle?.getTableView();
      if (view == null) return;
      localStorage.setItem('chronix-table-vue2-demo-saved-view', JSON.stringify(view));
      this.savedViewStatus = `saved (${view.columns.length} cols, sort=${view.sort.length}, filter=${view.filter.length})`;
    },
    onLoadView(): void {
      const raw = localStorage.getItem('chronix-table-vue2-demo-saved-view');
      if (raw == null) {
        this.savedViewStatus = 'no saved view';
        return;
      }
      try {
        const parsed = JSON.parse(raw) as { version: number };
        const handle = this.$refs['table'] as unknown as TableHandle | undefined;
        handle?.applyTableView(parsed as never);
        this.savedViewStatus = 'loaded';
      } catch (err) {
        this.savedViewStatus = `parse error: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
    onColumnsChange(payload: { columns: readonly ColumnSpec[]; reason: string }): void {
      // atomic prop rebuild on applyTableView.
      this.columns = payload.columns;
    },
    onJumpFarActiveCell(): void {
      // programmatic setActiveCell to a far cell — exercises
      // the auto-scroll path that the keyboard nav also hits. r19 is
      // the last row on page 1 (page size = 20) so it's definitely
      // below the visible viewport; `qty` is a center (non-pinned) col.
      (this.$refs['table'] as unknown as TableHandle | undefined)?.setActiveCell('r19', 'qty');
    },
    // (2026-05-27 — vue2 port of vue3): demo pill
    // for `header-group-click`. Empty placeholder cells never fire
    // (they have no `data-group-name` attr) so this only updates on
    // labelled group cells.
    onHeaderGroupClick(payload: HeaderGroupClickPayload): void {
      this.currentHeaderGroupClick = `${payload.groupName} (${payload.colIds.length} cols: ${payload.colIds.join(', ')})`;
    },
    // (vue2 port, 2026-05-28): tree-data handlers. Mirror
    // the vue3 demo's expanded-change emit + 全展开 / 全折叠 buttons.
    onTreeExpandedChange(payload: { readonly next: readonly string[] }): void {
      this.treeExpandedCount = payload.next.length;
    },
    onTreeExpandAll(): void {
      const treeHandle = this.$refs['treeTable'] as unknown as TableHandle | undefined;
      if (treeHandle == null) return;
      const parents = collectParentIds(this.treeRows);
      for (const id of parents) treeHandle.expandRow(id);
    },
    onTreeCollapseAll(): void {
      const treeHandle = this.$refs['treeTable'] as unknown as TableHandle | undefined;
      if (treeHandle == null) return;
      const parents = collectParentIds(this.treeRows);
      for (const id of parents) treeHandle.collapseRow(id);
    },
    onTier2ToggleLoading(): void {
      this.tier2Loading = !this.tier2Loading;
    },
    onTier2ToggleEmpty(): void {
      this.tier2EmptyMode = !this.tier2EmptyMode;
    },
    // demo (2026-05-28 — vue2 port): lazy-load tree children.
    lazyChildrenLoader(args: {
      readonly parent: RowSpec;
      readonly signal: AbortSignal;
    }): Promise<readonly RowSpec[]> {
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
    },
    onLazyStart(): void {
      this.lazyLoadCounts = { ...this.lazyLoadCounts, start: this.lazyLoadCounts.start + 1 };
    },
    onLazySuccess(): void {
      this.lazyLoadCounts = { ...this.lazyLoadCounts, success: this.lazyLoadCounts.success + 1 };
    },
    onLazyError(): void {
      this.lazyLoadCounts = { ...this.lazyLoadCounts, error: this.lazyLoadCounts.error + 1 };
    },
    onLazyInvalidateAll(): void {
      const handle = this.$refs['lazyTable'] as unknown as TableHandle | undefined;
      handle?.invalidateLazyChildren();
    },
    onToggleRowModelType(): void {
      const self = this as unknown as { rowModelType: 'clientSide' | 'serverSide' };
      self.rowModelType = self.rowModelType === 'serverSide' ? 'clientSide' : 'serverSide';
    },
    onRefreshServerSide(): void {
      const handle = this.$refs['serverSideTable'] as unknown as TableHandle | undefined;
      handle?.refreshServerSideRows();
    },
    onToggleServerSidePagination(): void {
      const self = this as unknown as { serverSideshowPagination: boolean };
      self.serverSideshowPagination = !self.serverSideshowPagination;
    },
    onInvalidateServerSideBlock0(): void {
      const handle = this.$refs['serverSideTable'] as unknown as TableHandle | undefined;
      handle?.invalidateServerSideBlocks([0]);
    },
    onColumnHeaderMenuAction(payload: {
      colId: string;
      action: 'sort-asc' | 'sort-desc' | 'clear-sort' | 'hide' | 'autosize';
    }): void {
      const self = this as unknown as { phase83LastContextAction: string };
      self.phase83LastContextAction = `${payload.action} on ${payload.colId}`;
    },
    onTier3EditClick(row: RowSpec): void {
      const self = this as unknown as { tier3Counter: Record<string, number> };
      const key = `${row.id}/edit`;
      self.tier3Counter = { ...self.tier3Counter, [key]: (self.tier3Counter[key] ?? 0) + 1 };
    },
    onTier3DeleteClick(row: RowSpec): void {
      const self = this as unknown as { tier3Counter: Record<string, number> };
      const key = `${row.id}/delete`;
      self.tier3Counter = { ...self.tier3Counter, [key]: (self.tier3Counter[key] ?? 0) + 1 };
    },
  },
});

// (2026-05-29 — vue2 port): mock async data source for the
// server-side demo. 250 rows, 500ms latency per block, AbortSignal-
// honoring cancellation.
function buildServerSideRowVue2(i: number): RowSpec {
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
const SERVER_SIDE_TOTAL_VUE2 = 250;
export const mockServerSideDataSourceVue2: ServerSideDataSource = {
  getRows(params: GetRowsParams): Promise<GetRowsResult> {
    return new Promise<GetRowsResult>((resolve, reject) => {
      const handle = setTimeout(() => {
        const slice: RowSpec[] = [];
        const end = Math.min(params.endRow, SERVER_SIDE_TOTAL_VUE2);
        for (let i = params.startRow; i < end; i++) slice.push(buildServerSideRowVue2(i));
        resolve({ rows: slice, totalRowCount: SERVER_SIDE_TOTAL_VUE2 });
      }, 500);
      params.signal.addEventListener('abort', () => {
        clearTimeout(handle);
        reject(new Error('aborted'));
      });
    });
  },
};
export const SERVER_SIDE_COLUMNS_VUE2: readonly ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: '名称', flex: 1 },
  { id: 'qty', field: 'qty', headerName: '数量', width: 100 },
  { id: 'price', field: 'price', headerName: '价格', width: 120 },
  { id: 'status', field: 'status', headerName: '状态', width: 100 },
  { id: 'note', field: 'note', headerName: '备注', width: 120 },
];
</script>

<template>
  <div class="demo-app">
    <aside class="demo-app-sidebar">
      <header class="demo-page__header">
        <h1>@chronixjs/table-vue2</h1>
        <p class="demo-page__sort-pill">
          {{ currentSortLabel || '未排序 (点击表头切换；Shift+点击 追加列)' }}
        </p>
        <p class="demo-page__filter-pill">
          {{ currentFilterLabel || '无过滤 (在表头下方输入框中输入)' }}
        </p>
        <p data-testid="quick-find-state" class="demo-page__filter-pill">
          {{
            currentQuickFindText
              ? `quick-find "${currentQuickFindText}" → ${currentQuickFindMatchCount} 行匹配`
              : '无 quick-find (输入框为空)'
          }}
        </p>
        <p class="demo-page__selection-pill">{{ currentSelectionLabel }}</p>
        <p class="demo-page__page-pill">{{ currentPageLabel }}</p>
        <p class="demo-page__edit-pill">
          {{ currentEditLabel || '未编辑 (双击 备注 列 → 输入 → Enter 提交)' }}
        </p>
        <p class="demo-page__resize-pill">
          {{ currentResizeLabel || '未调整列宽 (悬浮表头右边缘 → 拖动)' }}
        </p>
        <p class="demo-page__reorder-pill">
          {{ currentReorderLabel || '未拖拽列序 (拖动表头单元格 ≥ 5px → 落点 gap-line 显示)' }}
        </p>
        <p class="demo-page__range-pill">
          {{
            currentRangeLabel ||
            '未选择 cell 区域 (在 cell 上 pointerdown + drag 选区；shift+click 延伸；按钮可程序化设定/清空)'
          }}
        </p>
        <p class="demo-page__copy-pill">
          {{
            currentCopiedTsv || '未复制 cell-range (cell-range 激活后按 Ctrl+C / Cmd+C 复制为 TSV)'
          }}
        </p>
        <p class="demo-page__paste-pill">
          {{
            currentPasteSummary ||
            '未粘贴 cell-range (cell-range 激活后按 Ctrl+V / Cmd+V → 粘贴 TSV 到选区)'
          }}
        </p>
        <p class="demo-page__fill-pill">
          {{
            currentFillSummary ||
            '未触发 drag-fill (cell-range 激活后 drag 右下角小方块 → 沿主导轴 axis-lock)'
          }}
        </p>
        <p class="demo-page__history-pill">
          undo stack: past={{ currentUndoHistoryState.past.length }} future={{
            currentUndoHistoryState.future.length
          }}
          (Ctrl+Z/Y or buttons)
        </p>
        <p class="demo-page__history-replay-pill">
          {{
            currentHistoryReplay
              ? `最近 history-replay: ${currentHistoryReplay}`
              : '未触发 undo/redo'
          }}
        </p>
        <p class="demo-page__history-replay-pill">
          {{
            currentHeaderGroupClick
              ? `最近 header-group-click: ${currentHeaderGroupClick}`
              : '未触发 header-group-click'
          }}
        </p>
      </header>
    </aside>
    <main class="demo-app-main">
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
          <button type="button" data-testid="csv-export-btn" @click="onExportCsv">
            Export CSV
          </button>
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
          :show-column-header-menu="true"
          :context-menu="phase83ContextMenuConfig"
          @column-header-menu-action="onColumnHeaderMenuAction"
          :enable-keyboard-navigation="true"
          :enable-keyboard-auto-scroll="enableAutoScroll"
          selection-mode="multi"
          :selection-column="{ show: true, side: 'left' }"
          :row-drag-column="{ show: true, side: 'left' }"
          :show-pagination="true"
          :initial-page-size="20"
          cell-range-selection="enabled"
          :enable-undo-history="true"
          @sort-change="onSortChange"
          @filter-change="onFilterChange"
          @quick-find-text-change="onQuickFindTextChange"
          @selection-change="onSelectionChange"
          @page-change="onPageChange"
          @cell-value-change="onCellValueChange"
          @column-width-change="onColumnWidthChange"
          @column-order-change="onColumnOrderChange"
          @row-order-change="onRowOrderChange"
          @column-visibility-change="onColumnVisibilityChange"
          @columns-change="onColumnsChange"
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
          <h2>Tree data (vue2 port)</h2>
          <p>
            File-tree demo: ~85 行 nested 4 levels (project → module → folder → file). 单击 chevron
            切换展开 / 折叠；activeCell 在 <code>名称</code> 列时 <strong>Enter</strong> /
            <strong>Space</strong> 切换；<strong>ArrowRight</strong> 展开折叠节点；<strong
              >ArrowLeft</strong
            >
            折叠展开节点 (折叠态 + 有父则跳到父行)。
          </p>
          <div class="demo-page__autosize-actions">
            <button type="button" @click="onTreeExpandAll">全展开</button>
            <button type="button" @click="onTreeCollapseAll">全折叠</button>
            <span class="demo-page__sort-pill">当前展开: {{ treeExpandedCount }} 个节点</span>
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
            <strong>Pinned rows</strong>：顶端 ⭐ + 底端 合计 (RowSpec.pinned)；不参与 sort / filter
            / page / virtualization。 <strong>Tooltip</strong>：悬停 备注 列 250ms 出 popover。
            <strong>Overlay</strong>：loading / 空状态。
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
            <strong>Lazy load</strong>：<code>hasChildren: true</code> → 首次展开调用
            <code>childrenLoader</code>；500ms 模拟延迟；<code>lazy-fail-1</code> 失败 + 重试。
          </p>
          <div class="demo-page__autosize-actions">
            <button type="button" data-testid="lazy-invalidate-all" @click="onLazyInvalidateAll">
              Reload All
            </button>
            <span class="demo-page__sort-pill">
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
          <h2>Server-side row model (vue2)</h2>
          <p>
            <strong>Mock server</strong>: 250 rows fetched in blocks with 500ms latency per request.
            <strong>Skeleton rows</strong>: unloaded indices render shimmer bars.
            <strong>pagination</strong>: toggle ON → <code>pageSize</code> becomes block size, body
            renders only current page slice. <strong>invalidate</strong>: block 0 only — preserves
            <code>totalRowCount</code> + other blocks. <strong>Toggle</strong>: switch to
            <code>clientSide</code> mode to compare.
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
              Pagination: {{ serverSideshowPagination ? 'ON' : 'OFF' }}
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
          :rows="emptyServerSideRows"
          :row-model-type="rowModelType"
          :server-side-data-source="mockServerSideDataSource"
          :show-pagination="serverSideshowPagination"
          :initial-page-size="25"
          :show-filter-row="true"
        />
      </section>
      <section
        class="demo-page__table demo-page__tier3-finale-table"
        data-testid="tier3-finale-section"
      >
        <header>
          <h2>Tier 3 finale (vue2 — row number + actions + auto-height)</h2>
          <p>
            <strong>Row number</strong>: <code>ColumnSpec.rowNumber: true</code>.
            <strong>Actions</strong>: <code>ColumnSpec.actions</code>; <code>task-2</code>'s 删除 is
            disabled. <strong>Row auto-height</strong>: <code>enableRowAutoHeight: true</code> +
            <code>wrapText: true</code>.
          </p>
          <div class="demo-page__autosize-actions">
            <span class="demo-page__sort-pill" data-testid="tier3-edit-count">
              编辑点击次数: {{ tier3LastEditCount }}
            </span>
            <span class="demo-page__sort-pill" data-testid="tier3-delete-count">
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
      <section
        class="demo-page__table demo-page__tool-panel-table"
        data-testid="tool-panel-section"
      >
        <header>
          <h2>Tool-panel popover (vue2 — chronix-NEW)</h2>
          <p>
            <strong>chronix-NEW popover</strong>: a settings (⚙) icon in the action column header
            opens a floating popover. <strong>4 panels</strong>: Info (live row/column count),
            Columns (visibility toggler), Filters (advanced filter DSL), + Help (keyboard
            shortcuts). <strong>Toggleable</strong>: click the icon to open/close; click outside or
            press Escape to dismiss.
          </p>
        </header>
        <ChronixTable
          data-testid="tool-panel-table"
          :columns="columns"
          :rows="rows"
          :tool-panel="toolPanelConfig"
        />
      </section>
    </main>
  </div>
</template>
