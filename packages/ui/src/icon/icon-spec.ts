/**
 * Icon IR — .
 *
 * Pure-data SVG icon descriptors consumed by Tree (chevron / check),
 * Select / Cascader / Dropdown (chevron / close), Checkbox (check /
 * minus), Modal / Drawer (close), Alert / Notification / Message
 * (status icons), Input (search / close), and any future component
 * needing an icon.
 *
 * Each icon is a `viewBox` rectangle plus one or more `<path>` elements.
 * Adapters render via:
 *
 * ```ts
 * <svg viewBox={spec.viewBox} fill="currentColor" width={size} height={size}>
 *   {spec.paths.map((p) => <path d={p.d} fillRule={p.fillRule ?? 'nonzero'} />)}
 * </svg>
 * ```
 *
 * Convention:
 *
 * - All chronix-NEW default icons use a `'0 0 24 24'` viewBox so they
 *   compose cleanly at common UI sizes (12/14/16/20/24px).
 * - Paths assume `fill="currentColor"` on the parent `<svg>` so colors
 *   inherit from the surrounding text style. Per-path `fillRule` is
 *   optional; defaults to `'nonzero'`. Use `'evenodd'` for donut shapes
 *   (e.g. ring outlines where an inner circle subtracts from an outer).
 */

/**
 * A single `<path>` element within an icon. Icons with multiple paths
 * (e.g. compound shapes, status icons combining a background circle
 * with a foreground glyph) supply one `IconPathSpec` per path.
 */
export interface IconPathSpec {
  /** SVG path data — the `d` attribute string. */
  readonly d: string;
  /**
   * SVG fill rule. Omit (or set `'nonzero'`) for typical filled shapes;
   * use `'evenodd'` for ring / donut shapes where overlapping sub-paths
   * should subtract.
   */
  readonly fillRule?: 'evenodd' | 'nonzero';
}

/**
 * A complete icon descriptor. Stored in the icon registry under
 * `IconSpec.name`; rendered by adapters as an `<svg>` element.
 */
export interface IconSpec {
  /**
   * Unique identifier within the icon registry. Convention: kebab-case
   * (`'chevron-down'`, `'eye-off'`). Consumers register custom icons
   * under their own names; the chronix-NEW default set ships under
   * stable names listed in `./default-icons.ts`.
   */
  readonly name: string;
  /**
   * SVG `viewBox` attribute string. All chronix-NEW defaults use
   * `'0 0 24 24'`; consumers registering custom icons may use any
   * viewBox.
   */
  readonly viewBox: string;
  /** One or more `<path>` elements composing the icon. */
  readonly paths: readonly IconPathSpec[];
}
