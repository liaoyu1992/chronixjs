import type { TimeRange } from './primitives.js';

export type AxisGranularity =
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'halfYear'
  | 'year';

export interface AxisSpec {
  readonly id: string;
  readonly range: TimeRange;
  readonly granularity: AxisGranularity;
  /** Intl.DateTimeFormat options for tick labels. */
  readonly labelFormat?: Intl.DateTimeFormatOptions;
}
