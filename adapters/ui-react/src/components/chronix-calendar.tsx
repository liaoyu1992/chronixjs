import {
  defaultCalendarProps,
  deriveCalendarViewMonth,
  ensureChronixCalendarStyles,
  generateCalendarGrid,
  nextCalendarMonth,
  prevCalendarMonth,
  resolveCalendarDayClassList,
  resolveCalendarHeaderClassList,
  resolveCalendarRootClassList,
  resolveCalendarWeekdayClassList,
  type CalendarViewMonth,
} from '@chronixjs/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

export interface ChronixCalendarProps {
  readonly value?: Date | undefined;
  readonly disabled?: boolean;
  readonly isDateDisabled?: ((date: Date) => boolean) | undefined;
  readonly onChange?: (value: Date | undefined) => void;
}

export function ChronixCalendar(props: ChronixCalendarProps): React.ReactElement {
  const { value, disabled = defaultCalendarProps.disabled, isDateDisabled, onChange } = props;

  useEffect(() => {
    ensureChronixCalendarStyles();
  }, []);

  const [viewMonth, setViewMonth] = useState<CalendarViewMonth>(() =>
    deriveCalendarViewMonth(value),
  );

  const grid = useMemo(
    () =>
      generateCalendarGrid({
        year: viewMonth.year,
        month: viewMonth.month,
        firstDayOfWeek: 0,
      }),
    [viewMonth],
  );

  const headerLabel = useMemo(() => {
    const m = MONTH_NAMES[viewMonth.month] ?? '';
    return `${m} ${viewMonth.year}`;
  }, [viewMonth]);

  const rootClassName = useMemo(
    () => resolveCalendarRootClassList({ disabled }).join(' '),
    [disabled],
  );

  const selectDate = useCallback(
    (date: Date) => {
      if (isDateDisabled?.(date)) return;
      onChange?.(date);
    },
    [isDateDisabled, onChange],
  );

  const weekdayNodes = WEEKDAY_LABELS.map((label, i) => (
    <div key={`wd-${i}`} className={resolveCalendarWeekdayClassList().join(' ')}>
      {label}
    </div>
  ));

  const dayNodes = grid.map((cell, i) => {
    const isSelected =
      cell.date.getFullYear() === value?.getFullYear() &&
      cell.date.getMonth() === value.getMonth() &&
      cell.date.getDate() === value.getDate();
    const isCellDisabled = isDateDisabled?.(cell.date) ?? false;

    const classes = resolveCalendarDayClassList({
      isCurrentMonth: cell.isCurrentMonth,
      isToday: cell.isToday,
      isSelected,
      isDisabled: isCellDisabled,
    }).join(' ');

    return (
      <div
        key={`day-${i}`}
        className={classes}
        data-testid={cell.isCurrentMonth ? `cal-day-${cell.dayOfMonth}` : undefined}
        onClick={() => {
          if (cell.isCurrentMonth && !isCellDisabled) selectDate(cell.date);
        }}
      >
        {cell.dayOfMonth}
      </div>
    );
  });

  return (
    <div className={rootClassName} data-testid="calendar-root">
      <div className={resolveCalendarHeaderClassList().join(' ')}>
        <button
          className="cx-ui-calendar__header-btn"
          onClick={() => setViewMonth(prevCalendarMonth(viewMonth))}
          data-testid="cal-prev-month"
        >
          ‹
        </button>
        <span className="cx-ui-calendar__header-label">{headerLabel}</span>
        <button
          className="cx-ui-calendar__header-btn"
          onClick={() => setViewMonth(nextCalendarMonth(viewMonth))}
          data-testid="cal-next-month"
        >
          ›
        </button>
      </div>
      <div className="cx-ui-calendar__weekdays">{weekdayNodes}</div>
      <div className="cx-ui-calendar__days">{dayNodes}</div>
    </div>
  );
}
