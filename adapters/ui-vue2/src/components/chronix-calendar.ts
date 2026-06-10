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
import { computed, defineComponent, h, ref, type PropType } from 'vue';

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

/**
 * `<ChronixCalendar>` — Vue 2 standalone calendar.
 * Phase 32 (2026-06-05). Always visible, no popup.
 */
export const ChronixCalendar = defineComponent({
  name: 'ChronixCalendar',
  props: {
    value: { type: Date as PropType<Date | undefined>, default: undefined },
    disabled: { type: Boolean, default: defaultCalendarProps.disabled },
    isDateDisabled: {
      type: Function as PropType<((date: Date) => boolean) | undefined>,
      default: undefined,
    },
  },
  emits: {
    'update:value': (_value: Date | undefined) => true,
  },
  setup(props, { emit }) {
    ensureChronixCalendarStyles();

    const viewMonth = ref<CalendarViewMonth>(deriveCalendarViewMonth(props.value));

    const grid = computed(() =>
      generateCalendarGrid({
        year: viewMonth.value.year,
        month: viewMonth.value.month,
        firstDayOfWeek: 0,
      }),
    );

    const headerLabel = computed(() => {
      const m = MONTH_NAMES[viewMonth.value.month] ?? '';
      return `${m} ${viewMonth.value.year}`;
    });

    const rootClass = computed(() =>
      resolveCalendarRootClassList({ disabled: props.disabled }).join(' '),
    );

    function selectDate(date: Date): void {
      if (props.isDateDisabled?.(date)) return;
      emit('update:value', date);
    }

    function goPrevMonth(): void {
      viewMonth.value = prevCalendarMonth(viewMonth.value);
    }

    function goNextMonth(): void {
      viewMonth.value = nextCalendarMonth(viewMonth.value);
    }

    return () => {
      const weekdayNodes = WEEKDAY_LABELS.map((label, i) =>
        h('div', { class: resolveCalendarWeekdayClassList().join(' '), key: `wd-${i}` }, label),
      );

      const dayNodes = grid.value.map((cell, i) => {
        const isSelected =
          cell.date.getFullYear() === props.value?.getFullYear() &&
          cell.date.getMonth() === props.value.getMonth() &&
          cell.date.getDate() === props.value.getDate();
        const isDisabled = props.isDateDisabled?.(cell.date) ?? false;

        const classes = resolveCalendarDayClassList({
          isCurrentMonth: cell.isCurrentMonth,
          isToday: cell.isToday,
          isSelected,
          isDisabled,
        }).join(' ');

        return h(
          'div',
          {
            key: `day-${i}`,
            class: classes,
            attrs: {
              'data-testid': cell.isCurrentMonth ? `cal-day-${cell.dayOfMonth}` : undefined,
            },
            on: {
              click: () => {
                if (cell.isCurrentMonth && !isDisabled) selectDate(cell.date);
              },
            },
          },
          String(cell.dayOfMonth),
        );
      });

      return h('div', { class: rootClass.value, attrs: { 'data-testid': 'calendar-root' } }, [
        h('div', { class: resolveCalendarHeaderClassList().join(' ') }, [
          h(
            'button',
            {
              class: 'cx-ui-calendar__header-btn',
              on: { click: goPrevMonth },
              attrs: { 'data-testid': 'cal-prev-month' },
            },
            '‹',
          ),
          h('span', { class: 'cx-ui-calendar__header-label' }, headerLabel.value),
          h(
            'button',
            {
              class: 'cx-ui-calendar__header-btn',
              on: { click: goNextMonth },
              attrs: { 'data-testid': 'cal-next-month' },
            },
            '›',
          ),
        ]),
        h('div', { class: 'cx-ui-calendar__weekdays' }, weekdayNodes),
        h('div', { class: 'cx-ui-calendar__days' }, dayNodes),
      ]);
    };
  },
});
