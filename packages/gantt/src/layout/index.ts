export type { AxisRangePlanner } from './axis-range-planner.js';
export { defaultAxisRangePlanner } from './axis-range-planner.js';
export type { BarPlacementPass } from './bar-placement-pass.js';
export { defaultBarPlacementPass } from './bar-placement-pass.js';
export type { BarStackHeightPass } from './bar-stack-height-pass.js';
export { defaultBarStackHeightPass } from './bar-stack-height-pass.js';
export {
  type LinkRouter,
  DependencyLineAlgorithm,
  defaultLinkRouter,
  predecessorAnchor,
  successorAnchor,
  type Anchor,
} from './link-router.js';
export type { RowSwimlaneLayout } from './row-swimlane-layout.js';
export { defaultRowSwimlaneLayout } from './row-swimlane-layout.js';
export type { VirtualizedPaneLayout } from './virtualized-pane-layout.js';
export { defaultVirtualizedPaneLayout } from './virtualized-pane-layout.js';
// chart-content-x → calendar-time pure helper, used by
// adapter pointerup handlers to populate `empty-area-click` payload's
// `time` field. Mirrors reference's `dateClick(DatePointApi)` mapping.
export { xToTime } from './x-to-time.js';
export type {
  AxisHeaderCell,
  AxisHeaderRow,
  AxisRangePlanInput,
  AxisTick,
  BarPlacementPassInput,
  BarPlacementPassOutput,
  BarStackHeightPassInput,
  BarStackHeightPassOutput,
  LinkRouterInput,
  LinkRouterOutput,
  PlacedBar,
  PlannedAxis,
  RoutedLink,
  RoutedLinkMarker,
  RowSwimlaneLayoutInput,
  RowSwimlaneLayoutOutput,
  IndexRange,
  SwimlaneStrip,
  ViewId,
  VirtualizedPaneLayoutInput,
  VirtualizedPaneLayoutOutput,
  VirtualizedPaneOverscan,
  VirtualizedPaneScroll,
  VirtualizedPaneViewport,
} from './types.js';
