import {
  defaultTimePickerProps,
  ensureChronixTimePickerStyles,
  formatTimeValue,
  generateTimeUnits,
  resolveTimePickerColumnClassList,
  resolveTimePickerColumnItemClassList,
  resolveTimePickerPanelClassList,
  resolveTimePickerRootClassList,
  resolveTimePickerTriggerClassList,
  type PopupPlacement,
} from '@chronixjs/ui';
import { getHours, getMinutes, getSeconds, setHours, setMinutes, setSeconds } from 'date-fns';
import { useCallback, useEffect, useMemo, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

import { usePopupLifecycle } from '../hooks/use-popup-lifecycle.js';

export interface ChronixTimePickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'placeholder'
> {
  readonly value?: Date | undefined;
  readonly format?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly clearable?: boolean;
  readonly hourStep?: number;
  readonly minuteStep?: number;
  readonly secondStep?: number;
  readonly use12Hours?: boolean;
  readonly placement?: PopupPlacement;
  readonly isHourDisabled?: ((hour: number) => boolean) | undefined;
  readonly isMinuteDisabled?: ((minute: number) => boolean) | undefined;
  readonly isSecondDisabled?: ((second: number) => boolean) | undefined;
  readonly show?: boolean | undefined;
  readonly onShowChange?: (show: boolean) => void;
  readonly onChange?: (value: Date | undefined) => void;
}

export function ChronixTimePicker(props: ChronixTimePickerProps): React.ReactElement {
  const {
    value,
    format: fmt = defaultTimePickerProps.format,
    placeholder = '',
    disabled = defaultTimePickerProps.disabled,
    clearable = defaultTimePickerProps.clearable,
    hourStep = defaultTimePickerProps.hourStep,
    minuteStep = defaultTimePickerProps.minuteStep,
    secondStep = defaultTimePickerProps.secondStep,
    use12Hours = defaultTimePickerProps.use12Hours,
    placement = defaultTimePickerProps.placement,
    isHourDisabled,
    isMinuteDisabled,
    isSecondDisabled,
    show = undefined,
    onShowChange,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixTimePickerStyles();
  }, []);

  const lifecycle = usePopupLifecycle({
    show,
    trigger: 'click',
    placement,
    offset: 4,
    flip: true,
    widthMatch: false,
    disabled,
    onVisibilityChange: (next) => {
      onShowChange?.(next);
    },
  });

  const displayText = useMemo(() => formatTimeValue(value, fmt), [value, fmt]);

  const timeUnits = useMemo(
    () => generateTimeUnits({ hourStep, minuteStep, secondStep, use12Hours }),
    [hourStep, minuteStep, secondStep, use12Hours],
  );

  const rootClassName = useMemo(
    () => resolveTimePickerRootClassList({ disabled, open: lifecycle.visible }).join(' '),
    [disabled, lifecycle.visible],
  );

  const triggerClassName = useMemo(
    () =>
      resolveTimePickerTriggerClassList({
        hasValue: value !== undefined,
        active: lifecycle.visible,
        placeholder: value === undefined,
      }).join(' '),
    [value, lifecycle.visible],
  );

  const currentHour = value !== undefined ? getHours(value) : -1;
  const currentMinute = value !== undefined ? getMinutes(value) : -1;
  const currentSecond = value !== undefined ? getSeconds(value) : -1;

  const selectHour = useCallback(
    (hour: number) => {
      if (isHourDisabled?.(hour)) return;
      const base = value ?? new Date();
      onChange?.(setHours(base, hour));
    },
    [value, isHourDisabled, onChange],
  );

  const selectMinute = useCallback(
    (minute: number) => {
      if (isMinuteDisabled?.(minute)) return;
      const base = value ?? new Date();
      onChange?.(setMinutes(base, minute));
    },
    [value, isMinuteDisabled, onChange],
  );

  const selectSecond = useCallback(
    (second: number) => {
      if (isSecondDisabled?.(second)) return;
      const base = value ?? new Date();
      onChange?.(setSeconds(base, second));
    },
    [value, isSecondDisabled, onChange],
  );

  const onTriggerClick = useCallback(() => {
    if (disabled) return;
    onShowChange?.(!lifecycle.visible);
  }, [disabled, lifecycle.visible, onShowChange]);

  const clearValue = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(undefined);
    },
    [onChange],
  );

  const hourItems = timeUnits.hours.map((hour) => {
    const isSelected = hour === currentHour;
    const isDisabled = isHourDisabled?.(hour) ?? false;
    return (
      <div
        key={`h-${hour}`}
        className={resolveTimePickerColumnItemClassList({ isSelected, isDisabled }).join(' ')}
        onClick={() => {
          if (!isDisabled) selectHour(hour);
        }}
        data-testid={`tp-hour-${hour}`}
      >
        {String(hour).padStart(2, '0')}
      </div>
    );
  });

  const minuteItems = timeUnits.minutes.map((minute) => {
    const isSelected = minute === currentMinute;
    const isDisabled = isMinuteDisabled?.(minute) ?? false;
    return (
      <div
        key={`m-${minute}`}
        className={resolveTimePickerColumnItemClassList({ isSelected, isDisabled }).join(' ')}
        onClick={() => {
          if (!isDisabled) selectMinute(minute);
        }}
        data-testid={`tp-minute-${minute}`}
      >
        {String(minute).padStart(2, '0')}
      </div>
    );
  });

  const secondItems = timeUnits.seconds.map((second) => {
    const isSelected = second === currentSecond;
    const isDisabled = isSecondDisabled?.(second) ?? false;
    return (
      <div
        key={`s-${second}`}
        className={resolveTimePickerColumnItemClassList({ isSelected, isDisabled }).join(' ')}
        onClick={() => {
          if (!isDisabled) selectSecond(second);
        }}
        data-testid={`tp-second-${second}`}
      >
        {String(second).padStart(2, '0')}
      </div>
    );
  });

  const panelContent = (
    <div className="cx-ui-time-picker__columns">
      <div className={resolveTimePickerColumnClassList().join(' ')} data-testid="tp-hour-column">
        {hourItems}
      </div>
      <div className={resolveTimePickerColumnClassList().join(' ')} data-testid="tp-minute-column">
        {minuteItems}
      </div>
      <div className={resolveTimePickerColumnClassList().join(' ')} data-testid="tp-second-column">
        {secondItems}
      </div>
    </div>
  );

  const portal =
    lifecycle.visible && lifecycle.portalTarget !== null
      ? createPortal(
          <div
            ref={lifecycle.popupRef}
            className={resolveTimePickerPanelClassList({ open: true }).join(' ')}
            style={lifecycle.popupStyle}
            {...lifecycle.popupHandlers}
            data-testid="time-picker-panel"
          >
            {panelContent}
          </div>,
          lifecycle.portalTarget,
        )
      : null;

  return (
    <div
      {...rest}
      ref={lifecycle.triggerRef as React.RefObject<HTMLDivElement>}
      className={rootClassName}
      data-testid={
        ((rest as Record<string, unknown>)['data-testid'] as string) ?? 'time-picker-root'
      }
      {...lifecycle.triggerHandlers}
      onClick={onTriggerClick}
    >
      <div className={triggerClassName}>
        <span className="cx-ui-time-picker__value-text">
          {value !== undefined ? displayText : placeholder || 'Select time'}
        </span>
        {clearable && value !== undefined && (
          <span className="cx-ui-time-picker__clear" onMouseDown={clearValue}>
            ✕
          </span>
        )}
        <span className="cx-ui-time-picker__icon">🕐</span>
      </div>
      {portal}
    </div>
  );
}
