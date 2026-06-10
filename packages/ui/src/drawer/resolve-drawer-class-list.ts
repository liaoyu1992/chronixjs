import type { DrawerPlacement } from './drawer-spec.js';

export interface ResolveDrawerClassListInput {
  readonly open: boolean;
  readonly mask: boolean;
  readonly placement: DrawerPlacement;
}

/**
 * Class list for the outer drawer wrapper. The `--placement-*` modifier
 * drives the CSS that positions the panel against the correct edge.
 */
export function resolveDrawerWrapperClassList(input: ResolveDrawerClassListInput): string[] {
  const classes = ['cx-ui-drawer-wrapper', `cx-ui-drawer-wrapper--placement-${input.placement}`];
  if (input.open) classes.push('cx-ui-drawer-wrapper--open');
  if (input.mask) classes.push('cx-ui-drawer-wrapper--with-mask');
  return classes;
}

/**
 * Class list for the inner drawer panel. Carries its own
 * `--placement-*` modifier (parallel to the wrapper) so consumer CSS
 * can style the panel without reaching up to the wrapper class.
 */
export function resolveDrawerPanelClassList(input: {
  readonly placement: DrawerPlacement;
}): string[] {
  return ['cx-ui-drawer', `cx-ui-drawer--placement-${input.placement}`];
}
