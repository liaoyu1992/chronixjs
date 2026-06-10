import type { MenuMode } from './menu-spec.js';

export interface ResolveMenuClassListInput {
  readonly mode: MenuMode;
  readonly collapsed: boolean;
  readonly disabled: boolean;
}

/**
 * Class list for the menu root `<ul>`. The `--mode-*` modifier
 * drives horizontal vs vertical layout. `--collapsed` flips
 * vertical-mode label visibility off.
 */
export function resolveMenuClassList(input: ResolveMenuClassListInput): string[] {
  const classes = ['cx-ui-menu', `cx-ui-menu--mode-${input.mode}`];
  if (input.collapsed && input.mode === 'vertical') {
    classes.push('cx-ui-menu--collapsed');
  }
  if (input.disabled) classes.push('cx-ui-menu--disabled');
  return classes;
}

export interface ResolveMenuItemClassListInput {
  /** Whether this item has nested children. */
  readonly hasChildren: boolean;
  /** Whether this item is currently expanded (only relevant if `hasChildren`). */
  readonly expanded: boolean;
  /** Whether this item is the active leaf (matches `MenuProps.value`). */
  readonly active: boolean;
  /** Whether this item is disabled (own field OR inherited from menu root). */
  readonly disabled: boolean;
}

/**
 * Class list for an individual `<li>` menu item. Driven entirely by
 * the input flags so the same helper produces classes for root-level
 * + nested items.
 */
export function resolveMenuItemClassList(input: ResolveMenuItemClassListInput): string[] {
  const classes = ['cx-ui-menu__item'];
  if (input.hasChildren) classes.push('cx-ui-menu__item--has-children');
  if (input.expanded) classes.push('cx-ui-menu__item--expanded');
  if (input.active) classes.push('cx-ui-menu__item--active');
  if (input.disabled) classes.push('cx-ui-menu__item--disabled');
  return classes;
}
