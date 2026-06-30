import type { EllipsisProps } from './ellipsis-spec.js';

/**
 * Compute class set for the Ellipsis root element.
 *
 * .
 *
 * Class structure:
 *
 * - `'cx-ui-ellipsis'` — always present.
 * - `'cx-ui-ellipsis--lines-{N}'` — when `props.lineClamp` is an
 *   integer in `[1, 5]`. The CSS stylesheet declares 5 modifier
 *   rules (`--lines-1` is the single-line three-piece;
 *   `--lines-2 / 3 / 4 / 5` are the multi-line clamps).
 *   Non-integer or out-of-range values omit the modifier and the
 *   CSS default (single-line clamp) takes over.
 * - `'cx-ui-ellipsis--with-tooltip'` — when `props.tooltip` is
 *   `true`. The adapter additionally sets the native HTML `title`
 *   attribute; this modifier is the CSS hook for any
 *   tooltip-related styling (e.g. dotted underline).
 */
export function resolveEllipsisClassList(props: EllipsisProps): string[] {
  const classes = ['cx-ui-ellipsis'];
  if (Number.isInteger(props.lineClamp) && props.lineClamp >= 1 && props.lineClamp <= 5) {
    classes.push(`cx-ui-ellipsis--lines-${props.lineClamp}`);
  }
  if (props.tooltip) classes.push('cx-ui-ellipsis--with-tooltip');
  return classes;
}
