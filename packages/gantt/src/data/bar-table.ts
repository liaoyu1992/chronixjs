import type { PendingTransaction } from './transaction.js';
import type { BarSpec, TimeRange } from '../ir/index.js';


/**
 * Mutable runtime collection of `BarSpec`s with transaction-overlay support.
 *
 * Implementations must keep `bars` referentially stable across reads when
 * nothing has changed, so reactive observers can cache cheaply.
 */
export interface BarTable {
  /** Effective bar set including any in-flight transaction overlay. */
  readonly bars: readonly BarSpec[];

  /** Currently active in-flight transaction, if any. */
  readonly inFlightTransaction: PendingTransaction | null;

  /** Look up by stable bar id. Returns `undefined` when absent. */
  getById(id: string): BarSpec | undefined;

  /** All bars on the given row, sorted by `range.start` ascending. */
  listByRow(rowId: string): readonly BarSpec[];

  /** All bars whose range overlaps the query window, sorted by `range.start`. */
  listInRange(range: TimeRange): readonly BarSpec[];
}
