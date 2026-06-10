import {
  buildOtpCells,
  defaultInputOtpProps,
  ensureChronixInputOtpStyles,
  resolveInputOtpClassList,
} from '@chronixjs/ui';
import {
  useEffect,
  useMemo,
  type ChangeEvent,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

export interface ChronixInputOtpProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  readonly value?: string;
  readonly length?: number;
  readonly disabled?: boolean;
  readonly error?: string | undefined;
  readonly onChange?: (value: string) => void;
  readonly onComplete?: (value: string) => void;
}

export function ChronixInputOtp(props: ChronixInputOtpProps): JSX.Element {
  const {
    value = defaultInputOtpProps.value,
    length = defaultInputOtpProps.length,
    disabled = defaultInputOtpProps.disabled,
    error = defaultInputOtpProps.error,
    onChange,
    onComplete,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixInputOtpStyles();
  }, []);

  const className = useMemo(
    () => resolveInputOtpClassList({ value, length, disabled, error }).join(' '),
    [disabled, error],
  );
  const cells = buildOtpCells(value, length);

  function commit(next: string) {
    const clamped = next.slice(0, length);
    onChange?.(clamped);
    if (clamped.length === length) onComplete?.(clamped);
  }

  function onCellInput(index: number, event: ChangeEvent<HTMLInputElement>) {
    const char = event.target.value.slice(-1);
    const arr = [...cells];
    arr[index] = char;
    commit(arr.join('').replace(/\s/g, ''));
  }

  function onCellKeydown(index: number, event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && cells[index] === '' && index > 0) {
      const arr = [...cells];
      arr[index - 1] = '';
      commit(arr.join('').replace(/\s/g, ''));
    }
  }

  return (
    <div {...rest} className={className}>
      {cells.map((cell, index) => (
        <input
          key={index}
          className="cx-ui-otp__cell"
          maxLength={1}
          value={cell}
          disabled={disabled}
          data-cell-index={index}
          onChange={(e) => onCellInput(index, e)}
          onKeyDown={(e) => onCellKeydown(index, e)}
        />
      ))}
      {error !== undefined && <span className="cx-ui-otp__error">{error}</span>}
    </div>
  );
}
