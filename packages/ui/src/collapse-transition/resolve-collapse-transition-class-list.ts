export interface ResolveCollapseTransitionClassListInput {
  readonly show: boolean;
}

export function resolveCollapseTransitionClassList(
  input: ResolveCollapseTransitionClassListInput,
): string[] {
  const classes = ['cx-ui-collapse-transition'];
  if (input.show) classes.push('cx-ui-collapse-transition--expanded');
  return classes;
}
