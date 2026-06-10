import type { LinkSpec } from '../ir/index.js';

export interface LinkTable {
  readonly links: readonly LinkSpec[];

  getById(id: string): LinkSpec | undefined;

  /** All links originating from the given bar. */
  listFrom(fromBarId: string): readonly LinkSpec[];

  /** All links terminating at the given bar. */
  listTo(toBarId: string): readonly LinkSpec[];
}
