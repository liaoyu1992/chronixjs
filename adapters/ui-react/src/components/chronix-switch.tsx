import {
  defaultSwitchProps,
  ensureChronixSwitchStyles,
  resolveSwitchClassList,
  type SwitchSize,
} from '@chronixjs/ui';
import { useEffect, useMemo, type ButtonHTMLAttributes } from 'react';

export interface ChronixSwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> {
  readonly checked?: boolean;
  readonly disabled?: boolean;
  readonly size?: SwitchSize;
  readonly error?: string | undefined;
  readonly onChange?: (checked: boolean) => void;
}

export function ChronixSwitch(props: ChronixSwitchProps): JSX.Element {
  const {
    checked = defaultSwitchProps.checked,
    disabled = defaultSwitchProps.disabled,
    size = defaultSwitchProps.size,
    error = defaultSwitchProps.error,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixSwitchStyles();
  }, []);

  const className = useMemo(
    () => resolveSwitchClassList({ checked, disabled, size, error }).join(' '),
    [checked, disabled, size, error],
  );

  function onClick() {
    if (disabled) return;
    onChange?.(!checked);
  }

  return (
    <button
      {...rest}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled ? true : undefined}
      disabled={disabled}
      className={className}
      onClick={onClick}
    >
      <span className="cx-ui-switch__handle" />
    </button>
  );
}
