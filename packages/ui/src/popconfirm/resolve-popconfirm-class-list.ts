import type { PopupPlacement } from '../popup/popup-spec.js';

export interface ResolvePopconfirmClassListInput {
  readonly actualPlacement: PopupPlacement;
  readonly open: boolean;
}

export function resolvePopconfirmClassList(input: ResolvePopconfirmClassListInput): string[] {
  const classes = ['cx-ui-popconfirm', `cx-ui-popconfirm--${input.actualPlacement}`];
  if (input.open) classes.push('cx-ui-popconfirm--open');
  return classes;
}
