export interface ResolveWaveClassListInput {
  readonly rippling: boolean;
  readonly disabled: boolean;
}

export function resolveWaveClassList(input: ResolveWaveClassListInput): string[] {
  const classes = ['cx-ui-wave'];
  if (input.rippling) classes.push('cx-ui-wave--rippling');
  if (input.disabled) classes.push('cx-ui-wave--disabled');
  return classes;
}
