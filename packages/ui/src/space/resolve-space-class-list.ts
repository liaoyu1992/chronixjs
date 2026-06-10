import type { SpaceProps } from './space-spec.js';

/**
 * Compute class set for the Space root element.
 *
 * Phase 17 (2026-06-02).
 *
 * Class structure:
 *
 * - `'cx-ui-space'` — always present.
 * - `'cx-ui-space--vertical'` — present iff `props.vertical` true.
 * - `'cx-ui-space--wrap'` — present iff `props.wrap` true (default).
 * - `'cx-ui-space--inline'` — present iff `props.inline` true.
 * - `'cx-ui-space--align-{value}'` — present iff `props.align` is
 *   defined; suffix is the CSS-native align-items value.
 * - `'cx-ui-space--justify-{value}'` — present iff `props.justify`
 *   is defined; suffix is the CSS-native justify-content value.
 *
 * The size / gap is NOT encoded as a class modifier — it is applied
 * as an inline `style.gap` by the adapter (via `resolveSpaceGap`).
 * Encoding size as a class would force the stylesheet to spell out
 * each numeric value, which doesn't compose with arbitrary numeric
 * `size` props.
 */
export function resolveSpaceClassList(props: SpaceProps): string[] {
  const classes = ['cx-ui-space'];
  if (props.vertical) classes.push('cx-ui-space--vertical');
  if (props.wrap) classes.push('cx-ui-space--wrap');
  if (props.inline) classes.push('cx-ui-space--inline');
  if (props.align !== undefined) classes.push(`cx-ui-space--align-${props.align}`);
  if (props.justify !== undefined) classes.push(`cx-ui-space--justify-${props.justify}`);
  return classes;
}
