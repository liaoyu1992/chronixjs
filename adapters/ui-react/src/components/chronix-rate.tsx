import {
  defaultRateProps,
  ensureChronixRateStyles,
  resolveRateClassList,
  resolveRateStarState,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes, type MouseEvent as ReactMouseEvent } from 'react';

const STAR_SVG_PATH =
  'M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.77l-5.2 2.73.99-5.78L1.58 7.62l5.82-.85L10 1.5z';

export interface ChronixRateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  readonly value?: number;
  readonly count?: number;
  readonly allowHalf?: boolean;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
  readonly error?: string | undefined;
  readonly onChange?: (value: number) => void;
}

export function ChronixRate(props: ChronixRateProps): JSX.Element {
  const {
    value = defaultRateProps.value,
    count = defaultRateProps.count,
    allowHalf = defaultRateProps.allowHalf,
    disabled = defaultRateProps.disabled,
    readonly = defaultRateProps.readonly,
    error = defaultRateProps.error,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixRateStyles();
  }, []);

  const className = useMemo(
    () =>
      resolveRateClassList({
        value,
        count,
        allowHalf,
        disabled,
        readonly,
        error,
      }).join(' '),
    [disabled, readonly, error],
  );

  function onStarClick(index: number, event: ReactMouseEvent<HTMLButtonElement>) {
    if (disabled || readonly) return;
    const target = event.currentTarget;
    const width = target.getBoundingClientRect().width;
    let next: number;
    if (allowHalf && event.nativeEvent.offsetX < width / 2) {
      next = index + 0.5;
    } else {
      next = index + 1;
    }
    onChange?.(next);
  }

  const stars = [];
  for (let i = 0; i < count; i++) {
    const state = resolveRateStarState(i, value, allowHalf);
    stars.push(
      <button
        key={i}
        type="button"
        className={`cx-ui-rate__star cx-ui-rate__star--${state}`}
        data-rate-index={i}
        disabled={disabled}
        onClick={(e) => onStarClick(i, e)}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d={STAR_SVG_PATH} fill="currentColor" />
        </svg>
      </button>,
    );
  }

  return (
    <div {...rest} className={className}>
      {stars}
      {error !== undefined && <span className="cx-ui-rate__error">{error}</span>}
    </div>
  );
}
