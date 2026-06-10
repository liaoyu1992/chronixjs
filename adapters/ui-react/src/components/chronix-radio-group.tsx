import {
  defaultRadioGroupProps,
  ensureChronixRadioStyles,
  resolveRadioGroupClassList,
  type RadioOption,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes } from 'react';

import { ChronixRadio } from './chronix-radio.js';

export interface ChronixRadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  readonly value?: string;
  readonly options?: readonly RadioOption[];
  readonly disabled?: boolean;
  readonly error?: string | undefined;
  readonly onChange?: (value: string) => void;
}

export function ChronixRadioGroup(props: ChronixRadioGroupProps): JSX.Element {
  const {
    value = defaultRadioGroupProps.value,
    options = defaultRadioGroupProps.options,
    disabled = defaultRadioGroupProps.disabled,
    error = defaultRadioGroupProps.error,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixRadioStyles();
  }, []);

  const className = useMemo(
    () => resolveRadioGroupClassList({ value, options, disabled, error }).join(' '),
    [disabled, error],
  );

  return (
    <div {...rest} className={className} role="radiogroup">
      {options.map((opt) => (
        <ChronixRadio
          key={opt.key}
          checked={opt.value === value}
          value={opt.value}
          label={opt.label}
          disabled={opt.disabled || disabled}
          onChange={(v) => onChange?.(v)}
        />
      ))}
      {error !== undefined && <span className="cx-ui-radio-group__error">{error}</span>}
    </div>
  );
}
