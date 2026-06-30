/**
 * TreeSelect class-list resolver — .
 */

export interface ResolveTreeSelectRootClassListInput {
  readonly multiple: boolean;
  readonly disabled: boolean;
  readonly open: boolean;
}

export function resolveTreeSelectRootClassList(
  input: ResolveTreeSelectRootClassListInput,
): string[] {
  const classes = ['cx-ui-tree-select'];
  if (input.multiple) classes.push('cx-ui-tree-select--multiple');
  if (input.disabled) classes.push('cx-ui-tree-select--disabled');
  if (input.open) classes.push('cx-ui-tree-select--open');
  return classes;
}

export function resolveTreeSelectTriggerClassList(
  hasValue: boolean,
  active: boolean,
  placeholder: boolean,
): string[] {
  const classes = ['cx-ui-tree-select__trigger'];
  if (active) classes.push('cx-ui-tree-select__trigger--active');
  if (hasValue) classes.push('cx-ui-tree-select__trigger--has-value');
  if (placeholder) classes.push('cx-ui-tree-select__trigger--placeholder');
  return classes;
}

export function resolveTreeSelectDropdownClassList(): string[] {
  return ['cx-ui-tree-select__dropdown'];
}

export function resolveTreeSelectTreeClassList(): string[] {
  return ['cx-ui-tree-select__tree'];
}

export function resolveTreeSelectRowClassList(
  selected: boolean,
  focused: boolean,
  disabled: boolean,
): string[] {
  const classes = ['cx-ui-tree-select__tree-row'];
  if (selected) classes.push('cx-ui-tree-select__tree-row--selected');
  if (focused) classes.push('cx-ui-tree-select__tree-row--focused');
  if (disabled) classes.push('cx-ui-tree-select__tree-row--disabled');
  return classes;
}

export function resolveTreeSelectArrowClassList(active: boolean): string[] {
  const classes = ['cx-ui-tree-select__arrow'];
  if (active) classes.push('cx-ui-tree-select__arrow--active');
  return classes;
}

export function resolveTreeSelectEmptyClassList(): string[] {
  return ['cx-ui-tree-select__empty'];
}

export function resolveTreeSelectTagClassList(): string[] {
  return ['cx-ui-tree-select__tag'];
}

export function resolveTreeSelectTagCloseClassList(): string[] {
  return ['cx-ui-tree-select__tag-close'];
}
