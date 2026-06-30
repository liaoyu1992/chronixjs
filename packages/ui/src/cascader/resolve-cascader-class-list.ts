/**
 * Cascader class-list resolver — .
 */

export interface ResolveCascaderRootClassListInput {
  readonly multiple: boolean;
  readonly disabled: boolean;
  readonly open: boolean;
}

export function resolveCascaderRootClassList(input: ResolveCascaderRootClassListInput): string[] {
  const classes = ['cx-ui-cascader'];
  if (input.multiple) classes.push('cx-ui-cascader--multiple');
  if (input.disabled) classes.push('cx-ui-cascader--disabled');
  if (input.open) classes.push('cx-ui-cascader--open');
  return classes;
}

export function resolveCascaderTriggerClassList(
  hasValue: boolean,
  active: boolean,
  placeholder: boolean,
): string[] {
  const classes = ['cx-ui-cascader__trigger'];
  if (active) classes.push('cx-ui-cascader__trigger--active');
  if (hasValue) classes.push('cx-ui-cascader__trigger--has-value');
  if (placeholder) classes.push('cx-ui-cascader__trigger--placeholder');
  return classes;
}

export function resolveCascaderDropdownClassList(): string[] {
  return ['cx-ui-cascader__dropdown'];
}

export function resolveCascaderPanelClassList(): string[] {
  return ['cx-ui-cascader__panel'];
}

export function resolveCascaderOptionClassList(
  selected: boolean,
  active: boolean,
  disabled: boolean,
): string[] {
  const classes = ['cx-ui-cascader__option'];
  if (selected) classes.push('cx-ui-cascader__option--selected');
  if (active) classes.push('cx-ui-cascader__option--active');
  if (disabled) classes.push('cx-ui-cascader__option--disabled');
  return classes;
}

export function resolveCascaderArrowClassList(active: boolean): string[] {
  const classes = ['cx-ui-cascader__arrow'];
  if (active) classes.push('cx-ui-cascader__arrow--active');
  return classes;
}

export function resolveCascaderEmptyClassList(): string[] {
  return ['cx-ui-cascader__empty'];
}

export function resolveCascaderTagClassList(): string[] {
  return ['cx-ui-cascader__tag'];
}

export function resolveCascaderTagCloseClassList(): string[] {
  return ['cx-ui-cascader__tag-close'];
}
