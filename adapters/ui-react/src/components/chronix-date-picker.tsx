import {
  defaultDatePickerProps,
  deriveCalendarViewMonth,
  ensureChronixDatePickerStyles,
  formatDateValue,
  generateCalendarGrid,
  nextCalendarMonth,
  prevCalendarMonth,
  resolveDatePickerDayClassList,
  resolveDatePickerHeaderClassList,
  resolveDatePickerPanelClassList,
  resolveDatePickerRootClassList,
  resolveDatePickerTriggerClassList,
  resolveDatePickerWeekdayClassList,
  type CalendarViewMonth,
  type PopupPlacement,
} from '@chronixjs/ui';
import { useCallback, useEffect, useMemo, useState, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

import { usePopupLifecycle } from '../hooks/use-popup-lifecycle.js';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface ChronixDatePickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'placeholder'
> {
  readonly value?: Date | undefined;
  readonly format?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly clearable?: boolean;
  readonly placement?: PopupPlacement;
  readonly firstDayOfWeek?: number;
  readonly isDateDisabled?: ((date: Date) => boolean) | undefined;
  readonly show?: boolean | undefined;
  readonly onShowChange?: (show: boolean) => void;
  readonly onChange?: (value: Date | undefined) => void;
}

export function ChronixDatePicker(props: ChronixDatePickerProps): React.ReactElement {
  const {
    value,
    format: fmt = defaultDatePickerProps.format,
    placeholder = '',
    disabled = defaultDatePickerProps.disabled,
    clearable = defaultDatePickerProps.clearable,
    placement = defaultDatePickerProps.placement,
    firstDayOfWeek = defaultDatePickerProps.firstDayOfWeek,
    isDateDisabled,
    show = undefined,
    onShowChange,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixDatePickerStyles();
  }, []);

  const [viewMonth, setViewMonth] = useState<CalendarViewMonth>(() =>
    deriveCalendarViewMonth(value),
  );

  const lifecycle = usePopupLifecycle({
    show,
    trigger: 'click',
    placement,
    offset: 4,
    flip: true,
    widthMatch: true,
    disabled,
    onVisibilityChange: (next) => {
      onShowChange?.(next);
      if (next) setViewMonth(deriveCalendarViewMonth(value));
    },
  });

  const displayText = useMemo(() => formatDateValue(value, fmt), [value, fmt]);

  const grid = useMemo(
    () =>
      generateCalendarGrid({
        year: viewMonth.year,
        month: viewMonth.month,
        firstDayOfWeek,
      }),
    [viewMonth, firstDayOfWeek],
  );

  const headerLabel = useMemo(() => {
    const m = MONTH_NAMES[viewMonth.month] ?? '';
    return `${m} ${viewMonth.year}`;
  }, [viewMonth]);

  const weekdayLabels = useMemo(() => {
    const labels = [...WEEKDAY_LABELS];
    for (let i = 0; i < firstDayOfWeek; i++) labels.push(labels.shift()!);
    return labels;
  }, [firstDayOfWeek]);

  const rootClassName = useMemo(
    () => resolveDatePickerRootClassList({ disabled, open: lifecycle.visible }).join(' '),
    [disabled, lifecycle.visible],
  );

  const triggerClassName = useMemo(
    () =>
      resolveDatePickerTriggerClassList({
        hasValue: value !== undefined,
        active: lifecycle.visible,
        placeholder: value === undefined,
      }).join(' '),
    [value, lifecycle.visible],
  );

  const selectDate = useCallback(
    (date: Date) => {
      if (isDateDisabled?.(date)) return;
      onChange?.(date);
      onShowChange?.(false);
    },
    [isDateDisabled, onChange, onShowChange],
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

  // Build weekday headers
  const weekdayNodes = weekdayLabels.map((label, i) => (
    <div key={`wd-${i}`} className={resolveDatePickerWeekdayClassList().join(' ')}>
      {label}
    </div>
  ));

  // Build day cells
  const dayNodes = grid.map((cell, i) => {
    const isSelected =
      cell.date.getFullYear() === value?.getFullYear() &&
      cell.date.getMonth() === value.getMonth() &&
      cell.date.getDate() === value.getDate();
    const isCellDisabled = isDateDisabled?.(cell.date) ?? false;

    const classes = resolveDatePickerDayClassList({
      isCurrentMonth: cell.isCurrentMonth,
      isToday: cell.isToday,
      isSelected,
      isDisabled: isCellDisabled,
    }).join(' ');

    return (
      <div
        key={`day-${i}`}
        className={classes}
        data-testid={cell.isCurrentMonth ? `dp-day-${cell.dayOfMonth}` : undefined}
        onClick={() => {
          if (cell.isCurrentMonth && !isCellDisabled) selectDate(cell.date);
        }}
      >
        {cell.dayOfMonth}
      </div>
    );
  });

  const panelContent = (
    <>
      <div className={resolveDatePickerHeaderClassList().join(' ')}>
        <button
          className="cx-ui-date-picker__header-btn"
          onClick={() => setViewMonth(prevCalendarMonth(viewMonth))}
          data-testid="dp-prev-month"
        >
          ‹
        </button>
        <span className="cx-ui-date-picker__header-label">{headerLabel}</span>
        <button
          className="cx-ui-date-picker__header-btn"
          onClick={() => setViewMonth(nextCalendarMonth(viewMonth))}
          data-testid="dp-next-month"
        >
          ›
        </button>
      </div>
      <div className="cx-ui-date-picker__weekdays">{weekdayNodes}</div>
      <div className="cx-ui-date-picker__days">{dayNodes}</div>
    </>
  );

  const portal =
    lifecycle.visible && lifecycle.portalTarget !== null
      ? createPortal(
          <div
            ref={lifecycle.popupRef}
            className={resolveDatePickerPanelClassList({ open: true }).join(' ')}
            style={lifecycle.popupStyle}
            {...lifecycle.popupHandlers}
            data-testid="date-picker-panel"
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
        ((rest as Record<string, unknown>)['data-testid'] as string) ?? 'date-picker-root'
      }
      {...lifecycle.triggerHandlers}
      onClick={onTriggerClick}
    >
      <div className={triggerClassName}>
        <span className="cx-ui-date-picker__value-text">
          {value !== undefined ? displayText : placeholder || 'Select date'}
        </span>
        {clearable && value !== undefined && (
          <span className="cx-ui-date-picker__clear" onMouseDown={clearValue}>
            ✕
          </span>
        )}
        <span className="cx-ui-date-picker__icon">📅</span>
      </div>
      {portal}
    </div>
  );
}
