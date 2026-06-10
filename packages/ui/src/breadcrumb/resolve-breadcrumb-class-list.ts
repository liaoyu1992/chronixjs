import type { BreadcrumbProps } from './breadcrumb-spec.js';

/**
 * Compute class set for the Breadcrumb root `<nav>` element.
 *
 * Phase 19 (2026-06-02).
 *
 * `hasSeparatorSlot` comes from the adapter — `true` when the Vue
 * `separator` slot OR React `separatorNode` prop resolved to non-
 * empty content (overrides the `separator` string).
 *
 * Class structure:
 *
 * - `'cx-ui-breadcrumb'` — always present.
 * - `'cx-ui-breadcrumb--custom-separator'` — present iff
 *   `!hasSeparatorSlot && props.separator !== '/'` (consumer chose a
 *   non-default separator string but did NOT provide a slot). Lets
 *   consumers theme custom-separator breadcrumbs separately if
 *   desired without touching default ones.
 */
export function resolveBreadcrumbClassList(
  props: BreadcrumbProps,
  hasSeparatorSlot: boolean,
): string[] {
  const classes = ['cx-ui-breadcrumb'];
  if (!hasSeparatorSlot && props.separator !== '/') {
    classes.push('cx-ui-breadcrumb--custom-separator');
  }
  return classes;
}
