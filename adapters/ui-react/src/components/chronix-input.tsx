import {
  defaultInputProps,
  ensureChronixInputStyles,
  getInputInnerTag,
  resolveInputClassList,
  type InputSize,
  type InputType,
} from '@chronixjs/ui';
import {
  createElement,
  useEffect,
  useMemo,
  type FocusEvent as ReactFocusEvent,
  type HTMLAttributes,
} from 'react';

export interface ChronixInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'onFocus' | 'onBlur'
> {
  readonly value?: string;
  readonly type?: InputType;
  readonly placeholder?: string | undefined;
  readonly disabled?: boolean;
  readonly clearable?: boolean;
  readonly size?: InputSize;
  readonly rows?: number;
  readonly error?: string | undefined;
  readonly onChange?: (value: string) => void;
  readonly onFocus?: (event: ReactFocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readonly onBlur?: (event: ReactFocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readonly onClear?: () => void;
}

export function ChronixInput(props: ChronixInputProps): React.ReactElement {
  const {
    value = defaultInputProps.value,
    type = defaultInputProps.type,
    placeholder = defaultInputProps.placeholder,
    disabled = defaultInputProps.disabled,
    clearable = defaultInputProps.clearable,
    size = defaultInputProps.size,
    rows = defaultInputProps.rows,
    error = defaultInputProps.error,
    onChange,
    onFocus,
    onBlur,
    onClear,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixInputStyles();
  }, []);

  const resolvedProps = { value, type, placeholder, disabled, clearable, size, rows, error };
  const className = useMemo(
    () => resolveInputClassList(resolvedProps).join(' '),
    [type, size, disabled, clearable, error],
  );
  const innerTag = getInputInnerTag(resolvedProps);

  const innerProps: Record<string, unknown> = {
    className: 'cx-ui-input__inner',
    value,
    placeholder,
    disabled,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange?.(e.target.value),
    onFocus,
    onBlur,
  };
  if (innerTag === 'textarea') innerProps['rows'] = rows;

  return (
    <div {...rest} className={className}>
      {createElement(innerTag, innerProps)}
      {clearable && value !== '' && !disabled && (
        <button
          type="button"
          className="cx-ui-input__clear"
          onClick={() => {
            onChange?.('');
            onClear?.();
          }}
        >
          ×
        </button>
      )}
      {error !== undefined && <span className="cx-ui-input__error">{error}</span>}
    </div>
  );
}
