/**
 * Avatar IR — . Tier A image/text/fallback
 * avatar with shape + size.
 */

export type AvatarShape = 'circle' | 'square' | 'round';

export interface AvatarProps {
  /** Image URL. When defined, attempts <img>; falls through to text on error. */
  readonly src: string | undefined;
  /** Fallback text (e.g. initials). Used when src is undefined OR image errored. */
  readonly text: string | undefined;
  /** Width + height in px. */
  readonly size: number;
  readonly shape: AvatarShape;
}

export const defaultAvatarProps: AvatarProps = {
  src: undefined,
  text: undefined,
  size: 40,
  shape: 'circle',
};

/** Adapter-supplied context describing the current image-load state. */
export interface AvatarContentInput {
  readonly props: AvatarProps;
  readonly imageFailed: boolean;
  readonly hasFallback: boolean;
}

/**
 * Returns which content branch the adapter should render:
 *
 * - `'image'` — src is defined AND image hasn't errored.
 * - `'text'` — text fallback.
 * - `'fallback'` — consumer-supplied slot / children.
 */
export function resolveAvatarContent(input: AvatarContentInput): 'image' | 'text' | 'fallback' {
  const { props, imageFailed, hasFallback } = input;
  if (props.src !== undefined && !imageFailed) return 'image';
  if (props.text !== undefined) return 'text';
  if (hasFallback) return 'fallback';
  return 'text';
}
