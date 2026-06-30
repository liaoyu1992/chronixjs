/**
 * Image component IR — . Tier B enhanced `<img>`
 * with native lazy loading + error fallback + previewable lightbox via
 * inlined `<ChronixModal>` (adapter wires).
 *
 * Out-of-scope (v0.2):
 * - Image-group multi-image navigation.
 * - Preview toolbar (rotate / zoom / download).
 * - Progressive loading (blur-up placeholder).
 * - Custom IntersectionObserver options.
 * - AVIF / WebP fallback chain.
 */

/**
 * CSS `object-fit` value. Drives inline `style.objectFit` — NOT a
 * modifier class (5 values × cheap inline style).
 */
export type ImageObjectFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';

export interface ImageProps {
  readonly src: string;
  readonly alt: string | undefined;
  readonly width: number | string | undefined;
  readonly height: number | string | undefined;
  readonly objectFit: ImageObjectFit;
  /** When `true`, clicking the image opens a lightbox preview. */
  readonly previewable: boolean;
  /** When `true`, sets `loading="lazy"` on the `<img>`. */
  readonly lazy: boolean;
  /**
   * Fallback `src` applied when the primary image's `error` event
   * fires. `undefined` = no fallback (broken-image icon shows).
   */
  readonly fallback: string | undefined;
}

export const defaultImageProps: ImageProps = {
  src: '',
  alt: undefined,
  width: undefined,
  height: undefined,
  objectFit: 'cover',
  previewable: false,
  lazy: true,
  fallback: undefined,
};

/**
 * Resolve the effective image src given the load-failure state +
 * fallback config. Pure helper consumed by all 3 adapters.
 *
 * When the primary image has failed AND a fallback URL is defined,
 * the fallback is used. Otherwise the original src is returned.
 */
export function resolveImageEffectiveSrc(input: {
  readonly src: string;
  readonly fallback: string | undefined;
  readonly loadFailed: boolean;
}): string {
  if (input.loadFailed && input.fallback !== undefined) return input.fallback;
  return input.src;
}

/**
 * Resolve the inline `<img>` style. Width/height are normalized
 * (number → px, string → verbatim). `objectFit` always applied.
 */
export function resolveImageInlineStyle(input: {
  readonly width: number | string | undefined;
  readonly height: number | string | undefined;
  readonly objectFit: ImageObjectFit;
}): Record<string, string> {
  const style: Record<string, string> = { objectFit: input.objectFit };
  if (input.width !== undefined) {
    style['width'] = typeof input.width === 'number' ? `${input.width}px` : input.width;
  }
  if (input.height !== undefined) {
    style['height'] = typeof input.height === 'number' ? `${input.height}px` : input.height;
  }
  return style;
}
