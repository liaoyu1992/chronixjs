import type { DprIntent, TimeRange } from './primitives.js';

export interface BarProgress {
  /** 0..100. Out-of-range values clamp at the layout boundary, not here. */
  readonly value: number;
  readonly backgroundColor?: string;
  readonly textColor?: string;
  /** Template like `"- {value}% 完成"`; `{value}` is the only supported token. */
  readonly textFormat?: string;
  /** Default true. Suppress to render a progress fill with no text. */
  readonly showText?: boolean;
}

export interface BarStyleOverrides {
  readonly backgroundColor?: string;
  readonly borderColor?: string;
  readonly textColor?: string;
}

export interface BarSpec {
  readonly id: string;
  readonly rowId: string;
  readonly range: TimeRange;
  readonly title?: string;
  readonly style?: BarStyleOverrides;
  readonly progress?: BarProgress;
  /** Anti-regression hook #1: pixel-alignment intent for this bar's edges. */
  readonly dprIntent: DprIntent;
  /**
   * Anti-regression hook #2: which pointer-overlay group hosts this bar's
   * hit zones. Render layer resolves the id to a `PointerOverlayGroup`.
   * `undefined` = bar lives in the default hit layer.
   */
  readonly pointerOverlayId?: string;
  /** User-supplied opaque payload; never inspected by core code. */
  readonly extendedProps?: Readonly<Record<string, unknown>>;
}
