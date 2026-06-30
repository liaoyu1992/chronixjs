import type { GridProps } from './grid-spec.js';

/**
 * Compute class set for the Grid root element.
 *
 * .
 *
 * Class structure:
 *
 * - `'cx-ui-grid'` — always present.
 * - `'cx-ui-grid--inline'` — present iff `props.inline` true.
 *
 * Grid carries minimal class modifiers because its layout state is
 * driven almost entirely by inline `style` (grid-template-columns
 * + column-gap + row-gap from the prop bag). The class is reserved
 * for theme + scope selectors only.
 */
export function resolveGridClassList(props: GridProps): string[] {
  const classes = ['cx-ui-grid'];
  if (props.inline) classes.push('cx-ui-grid--inline');
  return classes;
}
