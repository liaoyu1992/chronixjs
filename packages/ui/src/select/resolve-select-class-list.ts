/**
 * Select class-list resolver — .
 *
 * Pure BEM class resolvers for Select root, trigger, dropdown, option,
 * filter-input, arrow, empty, tag, and tag-close elements.
 */

export interface ResolveSelectRootClassListInput {
  readonly multiple: boolean;
  readonly disabled: boolean;
  readonly filterable: boolean;
  readonly open: boolean;
}

export function resolveSelectRootClassList(input: ResolveSelectRootClassListInput): string[] {
  const classes = ['cx-ui-select'];
  if (input.multiple) classes.push('cx-ui-select--multiple');
  if (input.disabled) classes.push('cx-ui-select--disabled');
  if (input.filterable) classes.push('cx-ui-select--filterable');
  if (input.open) classes.push('cx-ui-select--open');
  return classes;
}

export interface ResolveSelectTriggerClassListInput {
  readonly hasValue: boolean;
  readonly active: boolean;
  readonly placeholder: boolean;
}

export function resolveSelectTriggerClassList(input: ResolveSelectTriggerClassListInput): string[] {
  const classes = ['cx-ui-select__trigger'];
  if (input.active) classes.push('cx-ui-select__trigger--active');
  if (input.hasValue) classes.push('cx-ui-select__trigger--has-value');
  if (input.placeholder) classes.push('cx-ui-select__trigger--placeholder');
  return classes;
}

export interface ResolveSelectDropdownClassListInput {
  readonly virtual: boolean;
}

export function resolveSelectDropdownClassList(
  input: ResolveSelectDropdownClassListInput,
): string[] {
  const classes = ['cx-ui-select__dropdown'];
  if (input.virtual) classes.push('cx-ui-select__dropdown--virtual');
  return classes;
}

export interface ResolveSelectOptionClassListInput {
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly groupLabel: boolean;
  readonly focused: boolean;
}

export function resolveSelectOptionClassList(input: ResolveSelectOptionClassListInput): string[] {
  const classes = ['cx-ui-select__option'];
  if (input.selected) classes.push('cx-ui-select__option--selected');
  if (input.disabled) classes.push('cx-ui-select__option--disabled');
  if (input.groupLabel) classes.push('cx-ui-select__option--group-label');
  if (input.focused) classes.push('cx-ui-select__option--focused');
  return classes;
}

export function resolveSelectArrowClassList(active: boolean): string[] {
  const classes = ['cx-ui-select__arrow'];
  if (active) classes.push('cx-ui-select__arrow--active');
  return classes;
}

export function resolveSelectEmptyClassList(): string[] {
  return ['cx-ui-select__empty'];
}

export function resolveSelectTagClassList(): string[] {
  return ['cx-ui-select__tag'];
}

export function resolveSelectTagCloseClassList(): string[] {
  return ['cx-ui-select__tag-close'];
}

export function resolveSelectFilterInputClassList(): string[] {
  return ['cx-ui-select__filter-input'];
}
