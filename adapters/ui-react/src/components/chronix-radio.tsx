import { defaultRadioProps, ensureChronixRadioStyles, resolveRadioClassList } from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes } from 'react';

export interface ChronixRadioProps extends Omit<HTMLAttributes<HTMLLabelElement>, 'onChange'> {
  readonly checked?: boolean;
  readonly value?: string;
  readonly label?: string;
  readonly disabled?: boolean;
  readonly onChange?: (value: string) => void;
}

export function ChronixRadio(props: ChronixRadioProps): React.ReactElement {
  const {
    checked = defaultRadioProps.checked,
    value = defaultRadioProps.value,
    label = defaultRadioProps.label,
    disabled = defaultRadioProps.disabled,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixRadioStyles();
  }, []);

  const className = useMemo(
    () => resolveRadioClassList({ checked, value, label, disabled }).join(' '),
    [checked, disabled],
  );

  function onClick() {
    if (disabled) return;
    onChange?.(value);
  }

  return (
    <label {...rest} className={className} onClick={onClick}>
      <span className="cx-ui-radio__circle" />
      <span className="cx-ui-radio__label">{label}</span>
    </label>
  );
}
