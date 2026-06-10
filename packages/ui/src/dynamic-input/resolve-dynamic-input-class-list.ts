export interface ResolveDynamicInputClassListInput {
  readonly disabled: boolean | undefined;
}

export function resolveDynamicInputClassList(props: ResolveDynamicInputClassListInput): string[] {
  const classes: string[] = ['cx-ui-dynamic-input'];
  if (props.disabled) {
    classes.push('cx-ui-dynamic-input--disabled');
  }
  return classes;
}
