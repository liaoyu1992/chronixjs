/**
 * Typography IR — . Tier A text-element
 * surface — single component with `variant` discriminator covering
 * surface — single component with `variant` discriminator covering
 * Text / Title / P / Blockquote / Hr.
 */

export type TypographyVariant = 'text' | 'title' | 'p' | 'blockquote' | 'hr';

export type TypographyLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface TypographyProps {
  readonly variant: TypographyVariant;
  /** Heading level — only consumed when `variant === 'title'`. */
  readonly level: TypographyLevel;
  readonly italic: boolean;
  readonly underline: boolean;
}

export const defaultTypographyProps: TypographyProps = {
  variant: 'text',
  level: 1,
  italic: false,
  underline: false,
};

/** Map variant → HTML tag the adapter should render. */
export function getTypographyTag(props: TypographyProps): string {
  switch (props.variant) {
    case 'text':
      return 'span';
    case 'title':
      return `h${props.level}`;
    case 'p':
      return 'p';
    case 'blockquote':
      return 'blockquote';
    case 'hr':
      return 'hr';
  }
}
