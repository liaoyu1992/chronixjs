import type { FloatButtonGroupTrigger } from './float-button-group-spec.js';
import type { FloatButtonShape } from '../float-button/float-button-spec.js';

export interface ResolveFloatButtonGroupClassListInput {
  readonly shape: FloatButtonShape;
  readonly trigger: FloatButtonGroupTrigger | undefined;
  readonly expanded: boolean;
}

export function resolveFloatButtonGroupClassList(
  input: ResolveFloatButtonGroupClassListInput,
): string[] {
  const classes = ['cx-ui-float-button-group', `cx-ui-float-button-group--shape-${input.shape}`];
  if (input.trigger !== undefined) {
    classes.push(`cx-ui-float-button-group--trigger-${input.trigger}`);
  }
  if (input.expanded) classes.push('cx-ui-float-button-group--expanded');
  return classes;
}
