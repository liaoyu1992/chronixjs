export interface ResolveBackTopClassListInput {
  readonly visible: boolean;
}

export function resolveBackTopClassList(input: ResolveBackTopClassListInput): string[] {
  const classes = ['cx-ui-back-top'];
  if (input.visible) classes.push('cx-ui-back-top--visible');
  return classes;
}
