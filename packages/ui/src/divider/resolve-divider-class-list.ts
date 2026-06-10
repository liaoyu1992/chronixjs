import type { DividerProps } from './divider-spec.js';

/**
 * Compute the array of CSS class names the adapter should apply to a
 * Divider's root element. Pure function — same algorithm across vue3
 * / vue2 / react adapters.
 *
 * Phase 13 (2026-06-02).
 *
 * Class structure:
 *
 * - `'cx-ui-divider'` — always present (BEM block).
 * - `'cx-ui-divider--horizontal'` or `'cx-ui-divider--vertical'` —
 *   exactly one of the two; drives flex direction + line orientation.
 * - `'cx-ui-divider--title-{placement}'` — present only when the
 *   divider is horizontal AND `hasTitle` is true. Placement comes
 *   from `props.titlePlacement`.
 * - `'cx-ui-divider--with-title'` — present only when the divider is
 *   horizontal AND `hasTitle` is true. Drives the asymmetric flex
 *   layout that pushes the line segments apart around the title.
 * - `'cx-ui-divider--dashed'` — present iff `props.dashed` true.
 *   Drives `border-style: dashed` on the line elements.
 *
 * Why does `hasTitle` come from the adapter, not the props bag? The
 * "is there content in the title slot?" question lives in the
 * framework layer (Vue 3 / Vue 2 slots / React children) and isn't
 * representable as a pure-data prop. The adapter resolves it once
 * (with the framework's slot-detection idiom) and passes the boolean
 * here, so all 3 adapters end up with identical class sets when the
 * title slot is populated.
 */
export function resolveDividerClassList(props: DividerProps, hasTitle: boolean): string[] {
  const classes = [
    'cx-ui-divider',
    props.vertical ? 'cx-ui-divider--vertical' : 'cx-ui-divider--horizontal',
  ];
  if (!props.vertical && hasTitle) {
    classes.push('cx-ui-divider--with-title');
    classes.push(`cx-ui-divider--title-${props.titlePlacement}`);
  }
  if (props.dashed) classes.push('cx-ui-divider--dashed');
  return classes;
}
