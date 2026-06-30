import {
  defaultCheckboxProps,
  ensureChronixCheckboxStyles,
  resolveCheckboxClassList,
  resolveCheckboxIconState,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixCheckboxProps extends Omit<
  HTMLAttributes<HTMLLabelElement>,
  'onChange' | 'children'
> {
  readonly checked?: boolean;
  readonly indeterminate?: boolean;
  readonly disabled?: boolean;
  readonly label?: string | undefined;
  readonly error?: string | undefined;
  readonly onChange?: (checked: boolean) => void;
  readonly children?: ReactNode;
}

export function ChronixCheckbox(props: ChronixCheckboxProps): React.ReactElement {
  const {
    checked = defaultCheckboxProps.checked,
    indeterminate = defaultCheckboxProps.indeterminate,
    disabled = defaultCheckboxProps.disabled,
    label = defaultCheckboxProps.label,
    error = defaultCheckboxProps.error,
    onChange,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixCheckboxStyles();
  }, []);

  const className = useMemo(
    () =>
      resolveCheckboxClassList({
        checked,
        indeterminate,
        disabled,
        label,
        error,
      }).join(' '),
    [checked, indeterminate, disabled, error],
  );
  const iconState = resolveCheckboxIconState(checked, indeterminate);

  function onClick() {
    if (disabled) return;
    onChange?.(!checked);
  }

  const labelContent: ReactNode = children ?? label ?? null;

  return (
    <label {...rest} className={className} onClick={onClick}>
      <span className="cx-ui-checkbox__box">
        {iconState === 'checked' && (
          <svg className="cx-ui-checkbox__icon" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M2.5 6L5 8.5L9.5 4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {iconState === 'indeterminate' && <span className="cx-ui-checkbox__icon" />}
      </span>
      {labelContent !== null && <span className="cx-ui-checkbox__label">{labelContent}</span>}
      {error !== undefined && <span className="cx-ui-checkbox__error">{error}</span>}
    </label>
  );
}
