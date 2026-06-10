export interface ResolveModalClassListInput {
  /** Whether the modal is currently visible (drives `--open` modifier). */
  readonly open: boolean;
  /** Whether the mask backdrop is rendered (drives `--with-mask` modifier). */
  readonly mask: boolean;
}

/**
 * Class list for the outer modal wrapper. Inner panel + mask + header
 * etc. carry static BEM element classes (`cx-ui-modal__*`) at adapter
 * scope; only the wrapper has stateful modifiers.
 */
export function resolveModalWrapperClassList(input: ResolveModalClassListInput): string[] {
  const classes = ['cx-ui-modal-wrapper'];
  if (input.open) classes.push('cx-ui-modal-wrapper--open');
  if (input.mask) classes.push('cx-ui-modal-wrapper--with-mask');
  return classes;
}
