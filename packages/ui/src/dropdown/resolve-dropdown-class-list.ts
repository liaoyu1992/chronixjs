import type { PopupPlacement } from '../popup/popup-spec.js';

export interface ResolveDropdownClassListInput {
  readonly actualPlacement: PopupPlacement;
  readonly open: boolean;
}

/**
 * Class list for the portal-mounted dropdown panel. Mirrors the
 * Phase 26 popover pattern (`--placement-*` modifier driven by the
 * post-flip `actualPlacement` + `--open` modifier on visible).
 */
export function resolveDropdownClassList(input: ResolveDropdownClassListInput): string[] {
  const classes = ['cx-ui-dropdown', `cx-ui-dropdown--${input.actualPlacement}`];
  if (input.open) classes.push('cx-ui-dropdown--open');
  return classes;
}

/**
 * Class list for an individual option row. `active` reflects the
 * keyboard-driven active state; `disabled` mirrors the option's
 * `disabled` field.
 */
export function resolveDropdownOptionClassList(input: {
  readonly active: boolean;
  readonly disabled: boolean;
}): string[] {
  const classes = ['cx-ui-dropdown__option'];
  if (input.active) classes.push('cx-ui-dropdown__option--active');
  if (input.disabled) classes.push('cx-ui-dropdown__option--disabled');
  return classes;
}
