import type { PopupPlacement } from '../popup/popup-spec.js';

export interface ResolveTooltipClassListInput {
  readonly actualPlacement: PopupPlacement;
  readonly open: boolean;
}

export function resolveTooltipClassList(input: ResolveTooltipClassListInput): string[] {
  const classes = ['cx-ui-tooltip', `cx-ui-tooltip--${input.actualPlacement}`];
  if (input.open) classes.push('cx-ui-tooltip--open');
  return classes;
}
