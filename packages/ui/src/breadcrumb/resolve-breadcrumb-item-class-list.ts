import { isBreadcrumbItemClickable } from './is-breadcrumb-item-clickable.js';

import type { BreadcrumbItem } from './breadcrumb-spec.js';

/**
 * Compute class set for a single Breadcrumb item element (`<a>` or
 * `<span>`).
 *
 * Phase 19 (2026-06-02).
 *
 * Class structure:
 *
 * - `'cx-ui-breadcrumb__item'` — always present.
 * - `'cx-ui-breadcrumb__item--current'` — present iff `isLast`. The
 *   trailing item is conventionally the current page and gets a
 *   distinct color (no link hover).
 * - `'cx-ui-breadcrumb__item--clickable'` — present iff
 *   `isBreadcrumbItemClickable(item)`. Drives cursor + hover styling.
 *
 * NB: both modifiers can coexist (a trailing item that is also
 * clickable — uncommon but valid). Adapters use the predicate +
 * `isLast` independently to decide DOM tag + handler attachment.
 */
export function resolveBreadcrumbItemClassList(item: BreadcrumbItem, isLast: boolean): string[] {
  const classes = ['cx-ui-breadcrumb__item'];
  if (isLast) classes.push('cx-ui-breadcrumb__item--current');
  if (isBreadcrumbItemClickable(item)) {
    classes.push('cx-ui-breadcrumb__item--clickable');
  }
  return classes;
}
