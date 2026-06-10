/**
 * Descriptions IR — Phase 21 (2026-06-03). Tier A multi-column
 * key-value display.
 *
 * Renders an iterated sequence of `(label, value)` item cells
 * laid out in a CSS-Grid grid of `columns` equal-fraction tracks.
 * Per-item `span: number` drives a `grid-column: span N` inline
 * style for items that should occupy more than one column (Phase
 * 21 Decision B.1 — the item-side mirror of Phase 17 Grid's
 * `cols: number` numeric shortcut).
 *
 * Per Phase 21 Decision D.1, items come EXCLUSIVELY from the
 * `items: readonly DescriptionItem[]` array prop (parallel to
 * Phase 19 Breadcrumb C.1 + Phase 20 Steps/Timeline D.1). No
 * `<ChronixDescriptionGroup>` sub-component.
 *
 * Public surface:
 *
 * - **`DescriptionsSize`** — closed union (`'small' | 'medium' |
 *   'large'`) driving padding scale.
 * - **`DescriptionsLabelPlacement`** — closed union (`'left' |
 *   'top'`) — left aligns label inline with value; top stacks
 *   label above value.
 * - **`DescriptionItem`** — exported interface; consumer-supplied
 *   array entry.
 * - **`DescriptionsProps`** + **`defaultDescriptionsProps`**.
 */

/** Padding scale. */
export type DescriptionsSize = 'small' | 'medium' | 'large';

/** Label position within each item cell. */
export type DescriptionsLabelPlacement = 'left' | 'top';

export interface DescriptionItem {
  /** Unique key for `v-for` / `Children.map`. */
  readonly key: string;
  /** Label text shown on the key side of the row. */
  readonly label: string;
  /** Value text shown on the value side of the row. */
  readonly value: string;
  /**
   * Number of grid columns this item should occupy. Default `1`.
   * When `<= 1` no inline style is emitted (CSS default `span: 1`
   * applies). When `> columns` the value is silently ignored
   * (spanning more than the grid width is non-meaningful).
   */
  readonly span: number;
}

export interface DescriptionsProps {
  /** Ordered item list. Empty array renders an empty grid. */
  readonly items: readonly DescriptionItem[];
  /**
   * Number of equal-fraction columns. Drives root
   * `grid-template-columns: repeat(N, minmax(0, 1fr))`. Default
   * `3`.
   */
  readonly columns: number;
  /** Adds a table-like border around the grid + per-item dividers. */
  readonly bordered: boolean;
  /** Label position within each item. */
  readonly labelPlacement: DescriptionsLabelPlacement;
  /** Padding scale. */
  readonly size: DescriptionsSize;
  /**
   * Optional header title. `undefined` omits the `__title` row +
   * the `--with-title` root modifier.
   */
  readonly title: string | undefined;
}

export const defaultDescriptionsProps: DescriptionsProps = {
  items: [],
  columns: 3,
  bordered: false,
  labelPlacement: 'left',
  size: 'medium',
  title: undefined,
};
