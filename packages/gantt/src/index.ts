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
  AnyTransaction,
  BarDragTransaction,
  BarResizeTransaction,
  CalendarRangeSelectTransaction,
  PointerCaptureConfig,
  ProgressHandleTransaction,
} from './interaction/index.js';

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
