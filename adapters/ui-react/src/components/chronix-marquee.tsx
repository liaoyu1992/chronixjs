import {
  computeMarqueeAnimationDurationSec,
  defaultMarqueeProps,
  ensureChronixMarqueeStyles,
  resolveMarqueeClassList,
  type MarqueeDirection,
} from '@chronixjs/ui';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export interface ChronixMarqueeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly direction?: MarqueeDirection;
  readonly speed?: number;
  readonly pauseOnHover?: boolean;
  readonly children?: ReactNode;
}

/**
 * `<ChronixMarquee>` — React port of the Marquee.
 *
 * Root `<div>` + inner `__track` carrying the children rendered
 * TWICE (for seamless loop). Animation runs as a pure CSS
 * `@keyframes` rule. Content size is measured post-mount via
 * `ResizeObserver` (when available) + initial
 * `getBoundingClientRect`; `computeMarqueeAnimationDurationSec`
 * computes the inline `animation-duration` value.
 */
export function ChronixMarquee(props: ChronixMarqueeProps): React.ReactElement {
  const {
    direction = defaultMarqueeProps.direction,
    speed = defaultMarqueeProps.speed,
    pauseOnHover = defaultMarqueeProps.pauseOnHover,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixMarqueeStyles();
  }, []);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [contentSize, setContentSize] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const firstChild = track.firstElementChild as HTMLElement | null;
    if (!firstChild) return;

    const isHorizontal = direction === 'left' || direction === 'right';
    const measure = (): void => {
      const rect = firstChild.getBoundingClientRect();
      setContentSize(isHorizontal ? rect.width : rect.height);
    };
    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(firstChild);
      return () => observer.disconnect();
    }
    return undefined;
  }, [direction, children]);

  const classList = useMemo(
    () => resolveMarqueeClassList({ direction, speed, pauseOnHover }).join(' '),
    [direction, speed, pauseOnHover],
  );

  const trackStyle: CSSProperties = {};
  const durationSec = computeMarqueeAnimationDurationSec(contentSize, speed);
  if (durationSec > 0) {
    trackStyle.animationName = `cx-ui-marquee-scroll-${direction}`;
    trackStyle.animationDuration = `${durationSec}s`;
    trackStyle.animationTimingFunction = 'linear';
    trackStyle.animationIterationCount = 'infinite';
  }

  return (
    <div {...rest} className={classList}>
      <div ref={trackRef} className="cx-ui-marquee__track" style={trackStyle}>
        <div className="cx-ui-marquee__copy">{children}</div>
        <div className="cx-ui-marquee__copy" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
