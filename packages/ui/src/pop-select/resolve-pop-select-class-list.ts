import type { PopupPlacement } from '../popup/popup-spec.js';

export interface ResolvePopSelectClassListInput {
  readonly actualPlacement: PopupPlacement;
  readonly open: boolean;
}

export function resolvePopSelectClassList(input: ResolvePopSelectClassListInput): string[] {
  const classes = ['cx-ui-pop-select', `cx-ui-pop-select--${input.actualPlacement}`];
  if (input.open) classes.push('cx-ui-pop-select--open');
  return classes;
}
