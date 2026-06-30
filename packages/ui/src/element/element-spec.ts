/**
 * Element IR — . Tier A generic chronix-themed
 * HTML element wrapper.
 */

export interface ElementProps {
  /** HTML tag to render. Default `'span'`. */
  readonly tag: string;
  /** When true, root displays inline. */
  readonly inline: boolean;
}

export const defaultElementProps: ElementProps = {
  tag: 'span',
  inline: false,
};
