import {
  defaultColorPickerProps,
  ensureChronixColorPickerStyles,
  resolveColorPickerPanelClassList,
  resolveColorPickerRootClassList,
  resolveColorPickerSwatchClassList,
  resolveColorPickerTriggerClassList,
} from '@chronixjs/ui';
import { useCallback, useEffect, useMemo, useState, type HTMLAttributes } from 'react';

export interface ChronixColorPickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  readonly value?: string | null | undefined;
  readonly swatches?: readonly string[] | undefined;
  readonly disabled?: boolean | undefined;
  readonly clearable?: boolean | undefined;
  readonly onChange?: (value: string | null) => void;
}

export function ChronixColorPicker(props: ChronixColorPickerProps): React.ReactElement {
  const {
    value,
    swatches = [],
    disabled = defaultColorPickerProps.disabled,
    clearable = defaultColorPickerProps.clearable,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixColorPickerStyles();
  }, []);

  const [open, setOpen] = useState(false);

  const rootClassName = useMemo(
    () => resolveColorPickerRootClassList({ disabled: disabled ?? false, open }).join(' '),
    [disabled, open],
  );

  const triggerClassName = useMemo(
    () => resolveColorPickerTriggerClassList({ hasValue: value != null }).join(' '),
    [value],
  );

  const selectColor = useCallback(
    (color: string) => {
      onChange?.(color);
    },
    [onChange],
  );

  const togglePanel = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => !prev);
  }, [disabled]);

  const clearValue = useCallback(() => {
    onChange?.(null);
  }, [onChange]);

  const swatchNodes = (swatches ?? []).map((color, i) => {
    const isActive = value === color;
    return (
      <div
        key={i}
        className={resolveColorPickerSwatchClassList({ active: isActive }).join(' ')}
        style={{ backgroundColor: color }}
        data-testid={`color-picker-swatch-${i}`}
        onClick={() => selectColor(color)}
      />
    );
  });

  return (
    <div {...rest} className={rootClassName} data-testid="color-picker-root">
      <div className={triggerClassName} data-testid="color-picker-trigger" onClick={togglePanel}>
        <div
          className="cx-ui-color-picker__color-preview"
          style={value ? { backgroundColor: value } : undefined}
        />
      </div>
      <div
        className={resolveColorPickerPanelClassList({ open }).join(' ')}
        data-testid="color-picker-panel"
      >
        <div className="cx-ui-color-picker__square" />
        <div className="cx-ui-color-picker__hue-strip" />
        <div className="cx-ui-color-picker__hex-input">
          <input
            className="cx-ui-color-picker__hex-field"
            value={value ?? ''}
            data-testid="color-picker-hex"
            readOnly
          />
        </div>
        {swatchNodes.length > 0 && (
          <div className="cx-ui-color-picker__swatches">{swatchNodes}</div>
        )}
        {clearable && (
          <button
            className="cx-ui-color-picker__clear"
            data-testid="color-picker-clear"
            onClick={clearValue}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
