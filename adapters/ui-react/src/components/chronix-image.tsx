import {
  defaultImageProps,
  ensureChronixImageStyles,
  resolveImageClassList,
  resolveImageEffectiveSrc,
  resolveImageInlineStyle,
  type ImageObjectFit,
} from '@chronixjs/ui';
import { useEffect, useState, type ImgHTMLAttributes, type SyntheticEvent } from 'react';

import { ChronixModal } from './chronix-modal.js';

export interface ChronixImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'alt' | 'width' | 'height' | 'loading' | 'onLoad' | 'onError' | 'onClick'
> {
  readonly src: string;
  readonly alt?: string;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly objectFit?: ImageObjectFit;
  readonly previewable?: boolean;
  readonly lazy?: boolean;
  readonly fallback?: string;
  readonly onLoad?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
  readonly onError?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
  readonly onPreviewOpen?: () => void;
  readonly onPreviewClose?: () => void;
}

export function ChronixImage(props: ChronixImageProps): JSX.Element {
  const {
    src,
    alt,
    width,
    height,
    objectFit = defaultImageProps.objectFit,
    previewable = defaultImageProps.previewable,
    lazy = defaultImageProps.lazy,
    fallback,
    onLoad,
    onError,
    onPreviewOpen,
    onPreviewClose,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixImageStyles();
  }, []);

  const [loadFailed, setLoadFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  function handleLoad(event: SyntheticEvent<HTMLImageElement, Event>): void {
    onLoad?.(event);
  }

  function handleError(event: SyntheticEvent<HTMLImageElement, Event>): void {
    setLoadFailed(true);
    onError?.(event);
  }

  function handleClick(): void {
    if (!previewable) return;
    setPreviewOpen(true);
    onPreviewOpen?.();
  }

  function handlePreviewChange(next: boolean): void {
    setPreviewOpen(next);
    if (!next) onPreviewClose?.();
  }

  const effectiveSrc = resolveImageEffectiveSrc({ src, fallback, loadFailed });
  const inlineStyle = resolveImageInlineStyle({ width, height, objectFit });

  const img = (
    <img
      {...rest}
      src={effectiveSrc}
      alt={alt ?? ''}
      loading={lazy ? 'lazy' : undefined}
      className={resolveImageClassList({ previewable, loadFailed }).join(' ')}
      style={inlineStyle}
      onLoad={handleLoad}
      onError={handleError}
      onClick={handleClick}
    />
  );

  if (!previewable) return img;

  return (
    <span className="cx-ui-image-wrapper">
      {img}
      <ChronixModal show={previewOpen} onShowChange={handlePreviewChange} width="auto">
        <div className="cx-ui-image-preview">
          <img className="cx-ui-image-preview__img" src={effectiveSrc} alt={alt ?? ''} />
        </div>
      </ChronixModal>
    </span>
  );
}
