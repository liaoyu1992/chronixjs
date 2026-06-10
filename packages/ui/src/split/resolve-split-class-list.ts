import type { SplitDirection } from './split-spec.js';

export interface ResolveSplitClassListInput {
  readonly direction: SplitDirection;
  readonly disabled: boolean;
}

export function resolveSplitClassList(input: ResolveSplitClassListInput): string[] {
  const classes = ['cx-ui-split', `cx-ui-split--direction-${input.direction}`];
  if (input.disabled) classes.push('cx-ui-split--disabled');
  return classes;
}
