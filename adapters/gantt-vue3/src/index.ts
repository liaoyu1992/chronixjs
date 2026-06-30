export {
  ChronixGantt,
  type BarDragStartPayload,
  type BarDragStopPayload,
  type BarResizeStartPayload,
  type BarResizeStopPayload,
} from './chronix-gantt.js';
// `ColumnSpec` + `computeRowSpans` migrated to core
// (`@chronixjs/gantt`). Re-exported here so existing consumers of
// `@chronixjs/gantt-vue3` keep working (re-export idiom).
export type { ColumnSpec } from '@chronixjs/gantt';
export { computeRowSpans } from '@chronixjs/gantt';
export type { UseGanttLayoutInput, UseGanttLayoutOutput } from './use-gantt-layout.js';
export { useGanttLayout } from './use-gantt-layout.js';
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
export { useGanttPointer } from './use-gantt-pointer.js';
export type {
  BarClickPayload,
  EmptyAreaClickPayload,
  SelectionChangePayload,
  UseGanttSelectionConfig,
  UseGanttSelectionOutput,
} from './use-gantt-selection.js';
export { useGanttSelection } from './use-gantt-selection.js';
export type { ChartScrollState } from './use-chart-scroll-state.js';
export { useChartScrollState } from './use-chart-scroll-state.js';
export { useScrollSync } from './use-scroll-sync.js';
export type { HeaderCellArg, HeaderCellClassNamesFunc } from '@chronixjs/gantt';
