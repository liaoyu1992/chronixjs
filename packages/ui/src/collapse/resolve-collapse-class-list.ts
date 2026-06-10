import type { CollapseArrowPlacement } from './collapse-spec.js';

export interface ResolveCollapseClassListInput {
  readonly arrowPlacement: CollapseArrowPlacement;
}

export function resolveCollapseClassList(input: ResolveCollapseClassListInput): string[] {
  return ['cx-ui-collapse', `cx-ui-collapse--arrow-${input.arrowPlacement}`];
}

export interface ResolveCollapseItemClassListInput {
  readonly expanded: boolean;
  readonly disabled: boolean;
}

export function resolveCollapseItemClassList(input: ResolveCollapseItemClassListInput): string[] {
  const classes = ['cx-ui-collapse__item'];
  if (input.expanded) classes.push('cx-ui-collapse__item--expanded');
  if (input.disabled) classes.push('cx-ui-collapse__item--disabled');
  return classes;
}
