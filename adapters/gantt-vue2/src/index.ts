export { ChronixGantt } from './chronix-gantt.js';
export type { ColumnSpec, HeaderCellArg, HeaderCellClassNamesFunc } from '@chronixjs/gantt';
export { computeRowSpans } from '@chronixjs/gantt';
export { useScrollSync } from './use-scroll-sync.js';
// re-export `useChartScrollState` + `ChartScrollState` for
// consumer parity with `@chronixjs/gantt-vue3`. Used by custom overlays
// that need to react to chart-pane scroll position.
export type { ChartScrollState } from './use-chart-scroll-state.js';
export { useChartScrollState } from './use-chart-scroll-state.js';
export { useGanttLayout } from './use-gantt-layout.js';
export type {
  MaybeRefOrGetter,
  UseGanttLayoutInput,
  UseGanttLayoutOutput,
} from './use-gantt-layout.js';
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
  BarClickPayload,
  EmptyAreaClickPayload,
  SelectionChangePayload,
  UseGanttSelectionConfig,
  UseGanttSelectionOutput,
} from './use-gantt-selection.js';
