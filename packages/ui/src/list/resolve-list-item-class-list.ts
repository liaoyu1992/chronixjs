import type { ListItem } from './list-spec.js';

/**
 * Compute class set for a single List item element.
 *
 * Phase 21 (2026-06-03).
 *
 * Conditional modifiers reflect which optional content fields
 * the item provides — adapters use the same flags to decide
 * which sub-elements to render. Centralizing the derivation
 * here keeps 3 adapters from re-deriving the
 * `item.prefix !== undefined` triple at every render call site
 * (parallel to Phase 19 PageHeader's `hasX = …` adapter idiom
 * but simpler — List has no slot authoring path).
 *
 * Class structure:
 *
 * - `'cx-ui-list__item'` — always present.
 * - `'cx-ui-list__item--with-prefix'` — when `item.prefix !==
 *   undefined`.
 * - `'cx-ui-list__item--with-suffix'` — when `item.suffix !==
 *   undefined`.
 * - `'cx-ui-list__item--with-description'` — when
 *   `item.description !== undefined`.
 */
export function resolveListItemClassList(item: ListItem): string[] {
  const classes = ['cx-ui-list__item'];
  if (item.prefix !== undefined) classes.push('cx-ui-list__item--with-prefix');
  if (item.suffix !== undefined) classes.push('cx-ui-list__item--with-suffix');
  if (item.description !== undefined) {
    classes.push('cx-ui-list__item--with-description');
  }
  return classes;
}
