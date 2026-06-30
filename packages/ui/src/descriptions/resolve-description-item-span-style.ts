import type { DescriptionItem } from './descriptions-spec.js';

/**
 * Inline style record for a single Description item that spans
 * more than one grid column.
 */
export interface DescriptionItemSpanStyle {
  readonly gridColumn: string;
}

/**
 * Compute the inline `style.gridColumn` value for a single
 * Description item, if any. Returns `undefined` when the CSS
 * default (`span: 1`) is sufficient.
 *
 * . Per-item mirror Grid's
 * `cols: number` decision (Decision B.1 of this phase). The
 * returned value is consumed by adapters as
 * `style.gridColumn = 'span N'` on the `__item` element.
 *
 * Opt-out conditions (return `undefined`):
 *
 * - `span <= 1` — CSS default already applies (each grid cell
 *   spans 1 column without explicit style).
 * - `span > columns` — spanning more columns than the grid has
 *   is non-meaningful; silently ignored rather than throwing or
 *   clamping. Consumers who pass a wider span than they have
 *   columns are expressing intent that the renderer cannot honor
 *   without overflowing; we render at the default span.
 *
 * Browser-serialization note: `element.style.gridColumn`
 * round-trips `'span N'` as `'auto / span N'` on read-back.
 * Playwright assertions match via regex `/span\s+N/`; this
 * helper's unit tests assert strict-equality on the
 * pre-serialization form (`'span N'`).
 */
export function resolveDescriptionItemSpanStyle(
  item: DescriptionItem,
  columns: number,
): DescriptionItemSpanStyle | undefined {
  if (item.span <= 1) return undefined;
  if (item.span > columns) return undefined;
  return { gridColumn: `span ${item.span}` };
}
