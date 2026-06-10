/**
 * Mention class-list resolver — Phase 31 (2026-06-04).
 */

export interface ResolveMentionRootClassListInput {
  readonly disabled: boolean;
  readonly open: boolean;
}

export function resolveMentionRootClassList(input: ResolveMentionRootClassListInput): string[] {
  const classes = ['cx-ui-mention'];
  if (input.disabled) classes.push('cx-ui-mention--disabled');
  if (input.open) classes.push('cx-ui-mention--open');
  return classes;
}

export function resolveMentionTextareaClassList(): string[] {
  return ['cx-ui-mention__textarea'];
}

export function resolveMentionDropdownClassList(): string[] {
  return ['cx-ui-mention__dropdown'];
}

export function resolveMentionOptionClassList(
  selected: boolean,
  focused: boolean,
  disabled: boolean,
): string[] {
  const classes = ['cx-ui-mention__option'];
  if (selected) classes.push('cx-ui-mention__option--selected');
  if (focused) classes.push('cx-ui-mention__option--focused');
  if (disabled) classes.push('cx-ui-mention__option--disabled');
  return classes;
}

export function resolveMentionEmptyClassList(): string[] {
  return ['cx-ui-mention__empty'];
}
