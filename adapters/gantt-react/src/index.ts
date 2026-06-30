export { ChronixGantt } from './chronix-gantt.js';
export type { BarClickPayload, ChronixGanttProps, EmptyAreaClickPayload } from './chronix-gantt.js';
// `ColumnSpec` + `computeRowSpans` migrated to core
// (`@chronixjs/gantt`). Re-exported here so existing consumers of
// `@chronixjs/gantt-react` keep working (re-export idiom).
export type { ColumnSpec } from '@chronixjs/gantt';
export { computeRowSpans } from '@chronixjs/gantt';
// re-export `HeaderCellArg` + `HeaderCellClassNamesFunc`
// for consumer parity with `@chronixjs/gantt-{vue3,vue2}`. Used when
// typing the `headerCellClassNamesCallback` prop.
export type { HeaderCellArg, HeaderCellClassNamesFunc } from '@chronixjs/gantt';
// re-export `useChartScrollState` + `useScrollSync` for
// consumer parity with `@chronixjs/gantt-{vue3,vue2}`. Used by custom
// overlays that need to react to chart-pane scroll position + by
// multi-pane scroll-sync compositions.
export type { ChartScrollState } from './use-chart-scroll-state.js';
export { useChartScrollState } from './use-chart-scroll-state.js';
export { useScrollSync } from './use-scroll-sync.js';
export { useGanttLayout } from './use-gantt-layout.js';
export type { UseGanttLayoutInput, UseGanttLayoutOutput } from './use-gantt-layout.js';
export { useGanttPointer } from './use-gantt-pointer.js';
export type {
  BarDragStartCallback,
  BarDragStopCallback,
  BarDropPayload,
  BarDropRejectedPayload,
  BarProgressPayload,
  BarResizePayload,
  BarResizeRejectedPayload,
  BarResizeStartCallback,
  BarResizeStopCallback,
  SelectPayload,
  SelectRejectedPayload,
  UseGanttPointerInput,
  UseGanttPointerOutput,
} from './use-gantt-pointer.js';
export { useGanttSelection } from './use-gantt-selection.js';
export type {
  BarClickPayload as SelectionBarClickPayload,
  EmptyAreaClickPayload as SelectionEmptyAreaClickPayload,
  SelectionChangePayload,
  UseGanttSelectionConfig,
  UseGanttSelectionOutput,
} from './use-gantt-selection.js';
