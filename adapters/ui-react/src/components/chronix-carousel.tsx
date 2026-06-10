import {
  computeLazyVisibleRange,
  computeNextCarouselIndex,
  computePrevCarouselIndex,
  defaultCarouselProps,
  ensureChronixCarouselStyles,
  findCarouselItemByIndex,
  getIcon,
  resolveCarouselClassList,
  resolveCarouselDotClassList,
  resolveCarouselSlideClassList,
  resolveCarouselThumbnailClassList,
  type CarouselDirection,
  type CarouselItem,
} from '@chronixjs/ui';
import { useCallback, useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixCarouselProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  readonly value: number;
  readonly items: readonly CarouselItem[];
  readonly autoplay?: boolean;
  readonly intervalMs?: number;
  readonly showDots?: boolean;
  readonly showArrows?: boolean;
  readonly loop?: boolean;
  readonly direction?: CarouselDirection;
  readonly lazy?: boolean;
  readonly thumbnails?: boolean;
  readonly onValueChange?: (index: number) => void;
  readonly onChange?: (item: CarouselItem, index: number) => void;
}

export function ChronixCarousel(props: ChronixCarouselProps): JSX.Element {
  const {
    value,
    items,
    autoplay = defaultCarouselProps.autoplay,
    intervalMs = defaultCarouselProps.intervalMs,
    showDots = defaultCarouselProps.showDots,
    showArrows = defaultCarouselProps.showArrows,
    loop = defaultCarouselProps.loop,
    direction = defaultCarouselProps.direction,
    lazy = false,
    thumbnails = false,
    onValueChange,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixCarouselStyles();
  }, []);

  const onValueChangeRef = useRef(onValueChange);
  const onChangeRef = useRef(onChange);
  onValueChangeRef.current = onValueChange;
  onChangeRef.current = onChange;

  const emitTo = useCallback(
    (nextIndex: number) => {
      const targetItem = findCarouselItemByIndex(items, nextIndex);
      if (targetItem === undefined) return;
      onValueChangeRef.current?.(nextIndex);
      onChangeRef.current?.(targetItem, nextIndex);
    },
    [items],
  );

  const goNext = useCallback(() => {
    emitTo(
      computeNextCarouselIndex({
        currentIndex: value,
        totalCount: items.length,
        loop,
      }),
    );
  }, [emitTo, items.length, loop, value]);

  const goPrev = useCallback(() => {
    emitTo(
      computePrevCarouselIndex({
        currentIndex: value,
        totalCount: items.length,
        loop,
      }),
    );
  }, [emitTo, items.length, loop, value]);

  useEffect(() => {
    if (!autoplay) return;
    if (items.length <= 1) return;
    const timer = setInterval(() => goNext(), intervalMs);
    return () => clearInterval(timer);
  }, [autoplay, intervalMs, items.length, goNext]);

  function renderArrowIcon(name: string): ReactNode {
    const spec = getIcon(name);
    if (spec === undefined) return <span>›</span>;
    return (
      <svg viewBox={spec.viewBox} width={18} height={18} fill="currentColor" aria-hidden="true">
        {spec.paths.map((p, i) =>
          p.fillRule !== undefined ? (
            <path key={i} d={p.d} fillRule={p.fillRule} />
          ) : (
            <path key={i} d={p.d} />
          ),
        )}
      </svg>
    );
  }

  const prevIcon = direction === 'horizontal' ? 'chevron-left' : 'chevron-up';
  const nextIcon = direction === 'horizontal' ? 'chevron-right' : 'chevron-down';

  return (
    <div {...rest} className={resolveCarouselClassList({ direction }).join(' ')}>
      <div className="cx-ui-carousel__viewport">
        {(() => {
          const visibleRange = computeLazyVisibleRange({
            activeIndex: value,
            totalCount: items.length,
            lazy: lazy ?? false,
          });
          return items.map((item, index) => {
            if (lazy && !visibleRange.includes(index)) {
              return (
                <div
                  key={item.key}
                  data-slide-key={item.key}
                  className={resolveCarouselSlideClassList({
                    active: index === value,
                  }).join(' ')}
                />
              );
            }
            return (
              <div
                key={item.key}
                data-slide-key={item.key}
                className={resolveCarouselSlideClassList({
                  active: index === value,
                }).join(' ')}
              >
                {item.content}
              </div>
            );
          });
        })()}
      </div>
      {showArrows && items.length > 1 ? (
        <div className="cx-ui-carousel__arrows">
          <button
            type="button"
            className="cx-ui-carousel__arrow cx-ui-carousel__arrow--prev"
            aria-label="Previous"
            onClick={goPrev}
          >
            {renderArrowIcon(prevIcon)}
          </button>
          <button
            type="button"
            className="cx-ui-carousel__arrow cx-ui-carousel__arrow--next"
            aria-label="Next"
            onClick={goNext}
          >
            {renderArrowIcon(nextIcon)}
          </button>
        </div>
      ) : null}
      {showDots && items.length > 0 ? (
        <div className="cx-ui-carousel__dots" role="tablist">
          {items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              data-dot-index={index}
              aria-label={`Go to slide ${index + 1}`}
              className={resolveCarouselDotClassList({
                active: index === value,
              }).join(' ')}
              onClick={() => emitTo(index)}
            />
          ))}
        </div>
      ) : null}
      {thumbnails && items.length > 0 && (
        <div className="cx-ui-carousel__thumbnails">
          {items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              className={resolveCarouselThumbnailClassList({ active: index === value }).join(' ')}
              onClick={() => emitTo(index)}
            >
              {item.thumbnailLabel ?? `${index + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
