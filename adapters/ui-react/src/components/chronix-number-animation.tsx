import {
  computeNumberAnimationTween,
  defaultNumberAnimationProps,
  ensureChronixNumberAnimationStyles,
  formatAnimatedNumber,
  resolveNumberAnimationClassList,
} from '@chronixjs/ui';
import { useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes } from 'react';

export interface ChronixNumberAnimationProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children'
> {
  readonly from?: number;
  readonly to?: number;
  readonly duration?: number;
  readonly precision?: number;
  readonly active?: boolean | undefined;
  readonly showSeparator?: boolean | undefined;
  readonly locale?: string;
}

/**
 * `<ChronixNumberAnimation>` — React 18 port of the NumberAnimation.
 * Animates a number from `from` to `to` over `duration` milliseconds using
 * requestAnimationFrame and the core IR tween/format helpers.
 */
export function ChronixNumberAnimation(props: ChronixNumberAnimationProps): React.ReactElement {
  const {
    from = defaultNumberAnimationProps.from,
    to = defaultNumberAnimationProps.to,
    duration = defaultNumberAnimationProps.duration,
    precision = defaultNumberAnimationProps.precision,
    active = defaultNumberAnimationProps.active,
    showSeparator = defaultNumberAnimationProps.showSeparator,
    locale,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixNumberAnimationStyles();
  }, []);

  const [displayValue, setDisplayValue] = useState(from);

  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const classList = useMemo(() => resolveNumberAnimationClassList().join(' '), []);

  const animate = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const tweened = computeNumberAnimationTween(from, to, progress);
      setDisplayValue(tweened);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    },
    [from, to, duration],
  );

  useEffect(() => {
    if (!active) {
      setDisplayValue(from);
      return;
    }
    startTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [active, animate, from]);

  const formatted = useMemo(
    () => formatAnimatedNumber(displayValue, precision, showSeparator ?? false, locale),
    [displayValue, precision, showSeparator, locale],
  );

  return (
    <span data-testid="number-animation-root" className={classList} {...rest}>
      {formatted}
    </span>
  );
}
