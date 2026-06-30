import type { BreadcrumbItem } from './breadcrumb-spec.js';

/**
 * Pure predicate — `true` when the item should render as a clickable
 * element (anchor when `href` is set; `role="link"` span otherwise).
 *
 * . Shared across 3 adapters so the
 * `__item--clickable` modifier + click-handler attachment decision
 * is byte-identical across vue3 / vue2 / react. Consumers reading
 * this predicate get the chronix-NEW definition of "clickable" in
 * one place rather than re-deriving from `item.href !== undefined ||
 * item.clickable` at every call site.
 *
 * Contract:
 *
 * - `href !== undefined` → clickable (true).
 * - `clickable: true` → clickable (true).
 * - Both unset → NOT clickable (false; trailing / current-page item).
 */
export function isBreadcrumbItemClickable(item: BreadcrumbItem): boolean {
  return item.clickable || item.href !== undefined;
}
