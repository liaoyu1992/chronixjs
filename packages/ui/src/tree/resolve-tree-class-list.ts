export interface ResolveTreeClassListInput {
  readonly virtual: boolean;
  readonly disabled: boolean;
}

export function resolveTreeClassList(input: ResolveTreeClassListInput): string[] {
  const classes = ['cx-ui-tree'];
  if (input.virtual) classes.push('cx-ui-tree--virtual');
  if (input.disabled) classes.push('cx-ui-tree--disabled');
  return classes;
}

export interface ResolveTreeRowClassListInput {
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly loading: boolean;
}

export function resolveTreeRowClassList(input: ResolveTreeRowClassListInput): string[] {
  const classes = ['cx-ui-tree__row'];
  if (input.selected) classes.push('cx-ui-tree__row--selected');
  if (input.disabled) classes.push('cx-ui-tree__row--disabled');
  if (input.loading) classes.push('cx-ui-tree__row--loading');
  return classes;
}

export interface ResolveTreeArrowClassListInput {
  readonly expanded: boolean;
}

export function resolveTreeArrowClassList(input: ResolveTreeArrowClassListInput): string[] {
  const classes = ['cx-ui-tree__arrow'];
  if (input.expanded) classes.push('cx-ui-tree__arrow--expanded');
  return classes;
}

export interface ResolveTreeDropIndicatorClassListInput {
  readonly position: 'before' | 'inside' | 'after';
}

export function resolveTreeDropIndicatorClassList(
  input: ResolveTreeDropIndicatorClassListInput,
): string[] {
  const classes = ['cx-ui-tree__drop-indicator'];
  classes.push(`cx-ui-tree__drop-indicator--${input.position}`);
  return classes;
}
