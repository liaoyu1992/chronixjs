/**
 * List IR — . Tier A vertical settings /
 * contact / file-row list display.
 *
 * Renders an iterated sequence of `(prefix + main + suffix)`
 * rows. Each row's main block holds a title + optional
 * description; the leading prefix + trailing suffix are
 * string-typed icon / glyph / metadata fields.
 *
 * Per Decision D.1, items come EXCLUSIVELY from the
 * `items: readonly ListItem[]` array prop (parallel
 * Breadcrumb C.1 + Steps/Timeline D.1). No
 * `<ChronixListItem>` sub-component.
 *
 * Public surface:
 *
 * - **`ListSize`** — closed union (`'small' | 'medium' | 'large'`)
 *   driving padding scale.
 * - **`ListItem`** — exported interface; consumer-supplied array
 *   entry.
 * - **`ListProps`** + **`defaultListProps`**.
 */

/** Padding scale. */
export type ListSize = 'small' | 'medium' | 'large';

export interface ListItem {
  /** Unique key for `v-for` / `Children.map`. */
  readonly key: string;
  /** Primary title text. */
  readonly title: string;
  /**
   * Optional sub-text shown below the title. `undefined` omits
   * the `__description` element + the `--with-description` item
   * modifier.
   */
  readonly description: string | undefined;
  /**
   * Optional leading icon / glyph. Short string (unicode glyph
   * or 1-3 characters). `undefined` omits the `__prefix` element
   * + the `--with-prefix` item modifier.
   */
  readonly prefix: string | undefined;
  /**
   * Optional trailing badge / metadata text. `undefined` omits
   * the `__suffix` element + the `--with-suffix` item modifier.
   */
  readonly suffix: string | undefined;
}

export interface ListProps {
  /** Ordered item list. Empty array renders an empty `<ul>`. */
  readonly items: readonly ListItem[];
  /** Adds a 1px outer border around the list. */
  readonly bordered: boolean;
  /** Adds a hover-bg modifier on each item. */
  readonly hoverable: boolean;
  /** Shows a 1px divider between items. Default `true`. */
  readonly showDivider: boolean;
  /** Padding scale. */
  readonly size: ListSize;
}

export const defaultListProps: ListProps = {
  items: [],
  bordered: false,
  hoverable: false,
  showDivider: true,
  size: 'medium',
};
