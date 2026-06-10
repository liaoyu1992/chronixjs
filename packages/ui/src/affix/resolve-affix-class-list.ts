export interface ResolveAffixClassListInput {
  readonly affixed: boolean;
}

export function resolveAffixClassList(input: ResolveAffixClassListInput): string[] {
  const classes = ['cx-ui-affix'];
  if (input.affixed) classes.push('cx-ui-affix--affixed');
  return classes;
}
