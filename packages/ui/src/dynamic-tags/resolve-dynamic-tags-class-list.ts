export interface ResolveDynamicTagsClassListInput {
  readonly disabled: boolean | undefined;
}

export function resolveDynamicTagsClassList(props: ResolveDynamicTagsClassListInput): string[] {
  const classes: string[] = ['cx-ui-dynamic-tags'];
  if (props.disabled) {
    classes.push('cx-ui-dynamic-tags--disabled');
  }
  return classes;
}
