import {
  createDynamicInputItem,
  defaultDynamicInputProps,
  ensureChronixDynamicInputStyles,
  resolveDynamicInputClassList,
} from '@chronixjs/ui';
import { useCallback, useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';

export interface ChronixDynamicInputProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  readonly value?: readonly unknown[];
  readonly min?: number;
  readonly max?: number | undefined;
  readonly disabled?: boolean | undefined;
  readonly placeholder?: string;
  readonly onChange?: (value: unknown[]) => void;
  readonly children?: ReactNode;
}

/**
 * `<ChronixDynamicInput>` — React 18 port of the Phase 35 DynamicInput.
 * Renders a dynamic list of value entries with add/remove actions.
 */
export function ChronixDynamicInput(props: ChronixDynamicInputProps): JSX.Element {
  const {
    value = defaultDynamicInputProps.value,
    min = defaultDynamicInputProps.min,
    max,
    disabled = defaultDynamicInputProps.disabled,
    placeholder = defaultDynamicInputProps.placeholder,
    onChange,
    children,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixDynamicInputStyles();
  }, []);

  const classList = useMemo(() => resolveDynamicInputClassList({ disabled }).join(' '), [disabled]);

  const canAdd = useMemo(() => {
    if (disabled) return false;
    if (max !== undefined && value.length >= max) return false;
    return true;
  }, [disabled, max, value.length]);

  const canRemove = useMemo(() => {
    if (disabled) return false;
    const effectiveMin = min ?? 0;
    return value.length > effectiveMin;
  }, [disabled, min, value.length]);

  const handleAdd = useCallback(() => {
    if (!canAdd) return;
    const next = [...value, createDynamicInputItem(value.length)];
    onChange?.(next);
  }, [canAdd, value, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      if (!canRemove) return;
      const next = [...value];
      next.splice(index, 1);
      onChange?.(next);
    },
    [canRemove, value, onChange],
  );

  return (
    <div data-testid="dynamic-input-root" className={classList} {...rest}>
      {children !== undefined ? (
        children
      ) : (
        <>
          <div className="cx-ui-dynamic-input__items">
            {value.map((item, index) => (
              <div key={index} className="cx-ui-dynamic-input__item">
                <input
                  className="cx-ui-dynamic-input__input"
                  value={String(item)}
                  placeholder={placeholder}
                  disabled={disabled}
                  readOnly
                />
                {canRemove ? (
                  <button
                    type="button"
                    className="cx-ui-dynamic-input__remove"
                    disabled={disabled}
                    onClick={() => handleRemove(index)}
                  >
                    −
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {canAdd ? (
            <button
              type="button"
              className="cx-ui-dynamic-input__add"
              disabled={disabled}
              onClick={handleAdd}
            >
              +
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
