export interface ResolveImageClassListInput {
  readonly previewable: boolean;
  readonly loadFailed: boolean;
}

export function resolveImageClassList(input: ResolveImageClassListInput): string[] {
  const classes = ['cx-ui-image'];
  if (input.previewable) classes.push('cx-ui-image--previewable');
  if (input.loadFailed) classes.push('cx-ui-image--failed');
  return classes;
}
