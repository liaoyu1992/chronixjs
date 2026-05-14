export const VERSION = '0.0.0';

export type {
  AxisGranularity,
  AxisSpec,
  BarProgress,
  BarSpec,
  BarStyleOverrides,
  ChartIR,
  CustomLinkMarker,
  DprIntent,
  LinkMarker,
  LinkRouting,
  LinkSpec,
  RowSpec,
  TimeRange,
  Viewport,
} from './ir/index.js';

export type { BarTable, LinkTable, PendingTransaction, RowDataSource } from './data/index.js';

export type {
  AdvanceBarDragInput,
  AnyTransaction,
  BarDragTransaction,
  BarResizeTransaction,
  BeginBarDragInput,
  CalendarRangeSelectTransaction,
  CommitBarDragInput,
  CommitBarDragOutput,
  PointerCaptureConfig,
  PointerCaptureSession,
  PointerPx,
  ProgressHandleTransaction,
} from './interaction/index.js';
export { defaultPointerCaptureSession } from './interaction/index.js';

export type {
  IRCanvas,
  PointerOverlayGroup,
  SlotContext,
  SlotRegistry,
  SlotRenderer,
  SlotTemplate,
} from './render/index.js';

export type {
  BarClickPayload,
  BarDropPayload,
  BarResizePayload,
  BarsSetPayload,
  GanttEventMap,
  GanttHandle,
  GanttOptions,
  ProgressChangePayload,
  SelectPayload,
  ViewChangePayload,
} from './api/index.js';

export type {
  AxisHeaderCell,
  AxisHeaderRow,
  AxisRangePlanInput,
  AxisRangePlanner,
  AxisTick,
  BarPlacementPass,
  BarPlacementPassInput,
  BarPlacementPassOutput,
  BarStackHeightPass,
  BarStackHeightPassInput,
  BarStackHeightPassOutput,
  LinkRouter,
  LinkRouterInput,
  LinkRouterOutput,
  PlacedBar,
  PlannedAxis,
  RoutedLink,
  RoutedLinkMarker,
  IndexRange,
  RowSwimlaneLayout,
  RowSwimlaneLayoutInput,
  RowSwimlaneLayoutOutput,
  SwimlaneStrip,
  ViewId,
  VirtualizedPaneLayout,
  VirtualizedPaneLayoutInput,
  VirtualizedPaneLayoutOutput,
  VirtualizedPaneOverscan,
  VirtualizedPaneScroll,
  VirtualizedPaneViewport,
} from './layout/index.js';
export {
  defaultAxisRangePlanner,
  defaultBarPlacementPass,
  defaultBarStackHeightPass,
  defaultLinkRouter,
  defaultRowSwimlaneLayout,
  defaultVirtualizedPaneLayout,
} from './layout/index.js';
