/**
 * Pagination BEM class-list resolvers — .
 */

export interface ResolvePaginationRootClassListInput {
  readonly disabled: boolean;
}

export function resolvePaginationRootClassList(
  input: ResolvePaginationRootClassListInput,
): string[] {
  const cls = ['cx-ui-pagination'];
  if (input.disabled) cls.push('cx-ui-pagination--disabled');
  return cls;
}

export interface ResolvePaginationItemClassListInput {
  readonly active: boolean;
  readonly disabled: boolean;
}

export function resolvePaginationItemClassList(
  input: ResolvePaginationItemClassListInput,
): string[] {
  const cls = ['cx-ui-pagination__item'];
  if (input.active) cls.push('cx-ui-pagination__item--active');
  if (input.disabled) cls.push('cx-ui-pagination__item--disabled');
  return cls;
}

export function resolvePaginationEllipsisClassList(): string[] {
  return ['cx-ui-pagination__ellipsis'];
}

export interface ResolvePaginationButtonClassListInput {
  readonly disabled: boolean;
}

export function resolvePaginationButtonClassList(
  input: ResolvePaginationButtonClassListInput,
): string[] {
  const cls = ['cx-ui-pagination__btn'];
  if (input.disabled) cls.push('cx-ui-pagination__btn--disabled');
  return cls;
}

export function resolvePaginationJumperClassList(): string[] {
  return ['cx-ui-pagination__jumper'];
}

export function resolvePaginationSizePickerClassList(): string[] {
  return ['cx-ui-pagination__size-picker'];
}
