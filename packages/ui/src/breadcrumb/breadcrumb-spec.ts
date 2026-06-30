/**
 * Breadcrumb IR — . Tier A navigation primitive.
 *
 * Renders a hierarchical-path navigation: a sequence of items
 * (typically 3-7) joined by a separator. Each item is either a link
 * (`href !== undefined` → `<a>`) or a non-navigating span (current
 * page / non-clickable). The trailing item is conventionally the
 * current page and rendered as a `<span>`.
 *
 * Per Decision C.1, items come EXCLUSIVELY from the
 * `items: readonly BreadcrumbItem[]` array prop. There is no
 * `<ChronixBreadcrumbItem>` sub-component (would double the export
 * surface for v0.1.0 with no consumer-side ergonomic gain over a
 * plain array).
 *
 * Per Decision D.1, items that are clickable (have `href`
 * OR `clickable: true`) always emit `item-click` (Vue) / call
 * `onItemClick(item)` (React) when clicked. Native `<a href>`
 * navigation is NOT suppressed — consumers wanting client-side
 * routing call `event.preventDefault()` on the native event.
 *
 * Public surface:
 *
 * - **`BreadcrumbItem`** — exported interface; consumer-supplied.
 * - **`BreadcrumbProps`** + **`defaultBreadcrumbProps`**.
 */

export interface BreadcrumbItem {
  /**
   * Unique key for `v-for` (Vue) / `Children.map` (React). Consumer-
   * supplied; chronix-ui does NOT auto-derive from `label` because
   * labels can repeat (e.g. two crumbs labeled "Details").
   */
  readonly key: string;
  /** Displayed text. */
  readonly label: string;
  /**
   * When set, renders the item as `<a href={href}>`. Browser-native
   * navigation fires on click; `item-click` event still emits
   * alongside per Decision D.1.
   */
  readonly href: string | undefined;
  /**
   * Forces clickability even when `href` is absent. Renders as
   * `<span role="link" tabindex="0">` + emits `item-click` on click.
   * Useful for SPA consumers whose routing is fully internal (no
   * `<a href>` semantics).
   */
  readonly clickable: boolean;
}

export interface BreadcrumbProps {
  /**
   * Ordered item list. Empty array renders an empty `<nav>` (valid
   * but visually nothing). Each item rendered in order; separator
   * inserted between consecutive items.
   */
  readonly items: readonly BreadcrumbItem[];
  /**
   * Separator string rendered between items. Default `'/'`. The
   * adapter's `separator` slot (Vue) / `separatorNode` prop (React)
   * overrides this when supplied.
   */
  readonly separator: string;
}

export const defaultBreadcrumbProps: BreadcrumbProps = {
  items: [],
  separator: '/',
};
