import {
  clampNumberInput,
  defaultInputNumberProps,
  ensureChronixInputNumberStyles,
  formatNumberInput,
  parseNumberInput,
  resolveInputNumberClassList,
  type InputNumberSize,
} from '@chronixjs/ui';
import {
  useEffect,
  useMemo,
  type ChangeEvent,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

export interface ChronixInputNumberProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  readonly value?: number | null;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number;
  readonly disabled?: boolean;
  readonly size?: InputNumberSize;
  readonly error?: string | undefined;
  readonly onChange?: (value: number | null) => void;
}

export function ChronixInputNumber(props: ChronixInputNumberProps): React.ReactElement {
  const {
    value = defaultInputNumberProps.value,
    min = defaultInputNumberProps.min,
    max = defaultInputNumberProps.max,
    step = defaultInputNumberProps.step,
    disabled = defaultInputNumberProps.disabled,
    size = defaultInputNumberProps.size,
    error = defaultInputNumberProps.error,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixInputNumberStyles();
  }, []);

  const className = useMemo(
    () =>
      resolveInputNumberClassList({
        value,
        min,
        max,
        step,
        disabled,
        size,
        error,
      }).join(' '),
    [size, disabled, error],
  );
  const displayValue = value === null ? '' : formatNumberInput(value);

  function clampCommit(next: number | null): number | null {
    if (next === null) return null;
    return clampNumberInput(next, {
      ...(min !== undefined ? { min } : {}),
      ...(max !== undefined ? { max } : {}),
      step,
    });
  }

  function stepBy(direction: 1 | -1) {
    if (disabled) return;
    const base = value ?? 0;
    let next = base + direction * step;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    onChange?.(next);
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const parsed = parseNumberInput(event.target.value);
    onChange?.(parsed);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      stepBy(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      stepBy(-1);
    } else if (event.key === 'Enter') {
      const target = event.currentTarget;
      const parsed = parseNumberInput(target.value);
      onChange?.(clampCommit(parsed));
    }
  }

  return (
    <div {...rest} className={className}>
      <button
        type="button"
        className="cx-ui-input-number__decrement"
        disabled={disabled}
        aria-label="decrement"
        onClick={() => stepBy(-1)}
      >
        −
      </button>
      <input
        className="cx-ui-input-number__input"
        type="text"
        inputMode="decimal"
        value={displayValue}
        disabled={disabled}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        className="cx-ui-input-number__increment"
        disabled={disabled}
        aria-label="increment"
        onClick={() => stepBy(1)}
      >
        +
      </button>
      {error !== undefined && <span className="cx-ui-input-number__error">{error}</span>}
    </div>
  );
}
