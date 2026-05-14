import type { BarSpec, LinkSpec, RowSpec, TimeRange } from '../ir/index.js';
import type { SlotTemplate } from '../render/index.js';

/** Payload for the `bar-drop` event — fired after a `BarDragTransaction` commits. */
export interface BarDropPayload {
  readonly barId: string;
  readonly oldRange: TimeRange;
  readonly newRange: TimeRange;
  readonly oldRowId: string;
  readonly newRowId: string;
}

/** Payload for the `bar-resize` event — fired after a `BarResizeTransaction` commits. */
export interface BarResizePayload {
  readonly barId: string;
  readonly edge: 'start' | 'end';
  readonly oldRange: TimeRange;
  readonly newRange: TimeRange;
}

/** Payload for the `progress-change` event — fired after a `ProgressHandleTransaction` commits. */
export interface ProgressChangePayload {
  readonly barId: string;
  readonly oldProgress: number;
  readonly newProgress: number;
}

/** Payload for the `bar-click` event. */
export interface BarClickPayload {
  readonly barId: string;
  readonly nativeEvent: MouseEvent;
}

/** Payload for the `select` event — fired after a `CalendarRangeSelectTransaction` commits. */
export interface SelectPayload {
  readonly rowId: string;
  readonly range: TimeRange;
}

/** Payload for the `view-change` event. */
export interface ViewChangePayload {
  readonly view: string;
  readonly date: Date;
}

/** Payload for the `bars-set` event — fired whenever the bar set is replaced or mutated. */
export interface BarsSetPayload {
  readonly bars: readonly BarSpec[];
}

/**
 * Map of event name → payload type. Used by `GanttHandle.subscribe` for
 * type-safe per-event listener signatures.
 */
export interface GanttEventMap {
  'bar-drop': BarDropPayload;
  'bar-resize': BarResizePayload;
  'progress-change': ProgressChangePayload;
  'bar-click': BarClickPayload;
  select: SelectPayload;
  'view-change': ViewChangePayload;
  'bars-set': BarsSetPayload;
}

/**
 * External configuration surface. Users supply this once at mount; adapters
 * forward it into the core. Shape is intentionally similar to common
 * scheduler-library option conventions so existing call sites can migrate
 * with renaming-only changes.
 *
 * v0 surface is minimal. Demo-specific options (`themeOverrides`,
 * `eventStyleCallbacks`, `markerType`, `lineStyle`, `todayLine`,
 * `resourceAreaColumns`, etc.) land in v1 when adapter MVPs need them.
 */
export interface GanttOptions {
  /** Initial bar set. Identifier collisions are caller's responsibility. */
  readonly bars: readonly BarSpec[];
  /** Initial row set. */
  readonly rows: readonly RowSpec[];
  /** Initial link set. Empty array if no dependencies. */
  readonly links?: readonly LinkSpec[];

  /** View id to load with. Adapter must register a matching view preset. */
  readonly initialView?: string;
  /** Anchor date for the initial view. ISO 8601 string or Date instance. */
  readonly initialDate?: Date | string;

  /** Allow drag / resize / progress interactions. Default false. */
  readonly editable?: boolean;
  /** Allow calendar range-select to create new bars. Default false. */
  readonly selectable?: boolean;

  /** BCP-47 locale code; affects date formatting and weekday start. */
  readonly locale?: string;

  /** Slot templates, keyed by slot name. Adapter merges with adapter-supplied defaults. */
  readonly slots?: Readonly<Record<string, SlotTemplate>>;

  /** Event callbacks. Equivalent to `GanttHandle.subscribe`, given as options for ergonomic call sites. */
  readonly onBarDrop?: (payload: BarDropPayload) => void;
  readonly onBarResize?: (payload: BarResizePayload) => void;
  readonly onProgressChange?: (payload: ProgressChangePayload) => void;
  readonly onBarClick?: (payload: BarClickPayload) => void;
  readonly onSelect?: (payload: SelectPayload) => void;
  readonly onViewChange?: (payload: ViewChangePayload) => void;
  readonly onBarsSet?: (payload: BarsSetPayload) => void;
}
