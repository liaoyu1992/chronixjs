import {
  computeCountdownTickIntervalMs,
  defaultCountdownProps,
  ensureChronixCountdownStyles,
  formatCountdownDuration,
  resolveCountdownClassList,
  type CountdownPrecision,
} from '@chronixjs/ui';
import { useEffect, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixCountdownProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'prefix'
> {
  readonly label?: string | undefined;
  readonly duration?: number;
  readonly precision?: CountdownPrecision;
  readonly active?: boolean;
  readonly prefix?: ReactNode;
  readonly suffix?: ReactNode;
  readonly onFinish?: () => void;
}

/**
 * `<ChronixCountdown>` — React port of the Countdown.
 *
 * Timer lives in a single `useEffect` keyed on `[active, duration,
 * precision]`. When any of those change, the effect tears down the
 * previous interval and starts a fresh one. `onFinish` is called
 * once when remaining reaches 0.
 */
export function ChronixCountdown(props: ChronixCountdownProps): JSX.Element {
  const {
    label = defaultCountdownProps.label,
    duration = defaultCountdownProps.duration,
    precision = defaultCountdownProps.precision,
    active = defaultCountdownProps.active,
    prefix,
    suffix,
    onFinish,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixCountdownStyles();
  }, []);

  const [remainingMs, setRemainingMs] = useState<number>(duration);

  useEffect(() => {
    setRemainingMs(duration);
    if (!active || duration <= 0) return undefined;
    const startedAt = Date.now();
    const tickIntervalMs = computeCountdownTickIntervalMs(precision);
    const id = setInterval(() => {
      const now = Date.now();
      const next = Math.max(0, duration - (now - startedAt));
      setRemainingMs(next);
      if (next <= 0) {
        clearInterval(id);
        onFinish?.();
      }
    }, tickIntervalMs);
    return () => {
      clearInterval(id);
    };
  }, [active, duration, precision, onFinish]);

  const hasPrefix = prefix !== undefined && prefix !== null;
  const hasSuffix = suffix !== undefined && suffix !== null;

  const classList = useMemo(
    () =>
      resolveCountdownClassList({ label, duration, precision, active }, hasPrefix, hasSuffix).join(
        ' ',
      ),
    [label, duration, precision, active, hasPrefix, hasSuffix],
  );

  const display = useMemo(
    () => formatCountdownDuration(remainingMs, precision),
    [remainingMs, precision],
  );

  return (
    <div {...rest} className={classList}>
      {label !== undefined ? <div className="cx-ui-countdown__label">{label}</div> : null}
      <div className="cx-ui-countdown__content">
        {hasPrefix ? <span className="cx-ui-countdown__prefix">{prefix}</span> : null}
        <span className="cx-ui-countdown__value">{display}</span>
        {hasSuffix ? <span className="cx-ui-countdown__suffix">{suffix}</span> : null}
      </div>
    </div>
  );
}
