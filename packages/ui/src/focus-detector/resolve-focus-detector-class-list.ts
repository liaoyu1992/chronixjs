export interface ResolveFocusDetectorClassListInput {
  readonly disabled: boolean;
}

export function resolveFocusDetectorClassList(input: ResolveFocusDetectorClassListInput): string[] {
  const classes = ['cx-ui-focus-detector'];
  if (input.disabled) classes.push('cx-ui-focus-detector--disabled');
  return classes;
}
