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
import { computed, defineComponent, h, ref, toRef, type PropType } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

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
 * `<ChronixDatePicker>` — Vue 2 date picker with calendar popup.
 * . Vue 2: no Teleport → inline popup with position: fixed.
 */
export const ChronixDatePicker = defineComponent({
  name: 'ChronixDatePicker',
  inheritAttrs: false,
  props: {
    value: { type: Date as PropType<Date | undefined>, default: undefined },
    format: { type: String, default: defaultDatePickerProps.format },
    placeholder: { type: String, default: defaultDatePickerProps.placeholder },
    disabled: { type: Boolean, default: defaultDatePickerProps.disabled },
    clearable: { type: Boolean, default: defaultDatePickerProps.clearable },
    placement: {
      type: String as PropType<PopupPlacement>,
      default: defaultDatePickerProps.placement,
    },
    firstDayOfWeek: { type: Number, default: defaultDatePickerProps.firstDayOfWeek },
    isDateDisabled: {
      type: Function as PropType<((date: Date) => boolean) | undefined>,
      default: undefined,
    },
    show: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  },
  emits: {
    'update:show': (_show: boolean) => true,
    'update:value': (_value: Date | undefined) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixDatePickerStyles();

    const viewMonth = ref<CalendarViewMonth>(deriveCalendarViewMonth(props.value));

    const lifecycle = usePopupLifecycle({
      show: toRef(props, 'show'),
      trigger: ref('click'),
      placement: toRef(props, 'placement'),
      offset: ref(4),
      flip: ref(true),
      widthMatch: ref(true),
      disabled: toRef(props, 'disabled'),
      onVisibilityChange: (next) => {
        emit('update:show', next);
        if (next) {
          viewMonth.value = deriveCalendarViewMonth(props.value);
        }
      },
    });

    const displayText = computed(() => formatDateValue(props.value, props.format));

    const grid = computed(() =>
      generateCalendarGrid({
        year: viewMonth.value.year,
        month: viewMonth.value.month,
        firstDayOfWeek: props.firstDayOfWeek,
      }),
    );

    const headerLabel = computed(() => {
      const m = MONTH_NAMES[viewMonth.value.month] ?? '';
      return `${m} ${viewMonth.value.year}`;
    });

    const weekdayLabels = computed(() => {
      const labels = [...WEEKDAY_LABELS];
      for (let i = 0; i < props.firstDayOfWeek; i++) {
        labels.push(labels.shift()!);
      }
      return labels;
    });

    const rootClass = computed(() =>
      resolveDatePickerRootClassList({
        disabled: props.disabled,
        open: lifecycle.visible.value,
      }).join(' '),
    );

    const triggerClass = computed(() =>
      resolveDatePickerTriggerClassList({
        hasValue: props.value !== undefined,
        active: lifecycle.visible.value,
        placeholder: props.value === undefined,
      }).join(' '),
    );

    function selectDate(date: Date): void {
      if (props.isDateDisabled?.(date)) return;
      emit('update:value', date);
      emit('update:show', false);
    }

    function onTriggerClick(): void {
      if (props.disabled) return;
      emit('update:show', !lifecycle.visible.value);
    }

    function clearValue(e: MouseEvent): void {
      e.stopPropagation();
      emit('update:value', undefined);
    }

    function goPrevMonth(): void {
      viewMonth.value = prevCalendarMonth(viewMonth.value);
    }

    function goNextMonth(): void {
      viewMonth.value = nextCalendarMonth(viewMonth.value);
    }

    return () => {
      const triggerChildren: string[] = [
        props.value !== undefined ? displayText.value : props.placeholder || 'Select date',
      ];

      // Weekday headers
      const weekdayNodes = weekdayLabels.value.map((label, i) =>
        h('div', { class: resolveDatePickerWeekdayClassList().join(' '), key: `wd-${i}` }, label),
      );

      // Day cells
      const dayNodes = grid.value.map((cell, i) => {
        const isSelected =
          cell.date.getFullYear() === props.value?.getFullYear() &&
          cell.date.getMonth() === props.value.getMonth() &&
          cell.date.getDate() === props.value.getDate();
        const isDisabled = props.isDateDisabled?.(cell.date) ?? false;

        const classes = resolveDatePickerDayClassList({
          isCurrentMonth: cell.isCurrentMonth,
          isToday: cell.isToday,
          isSelected,
          isDisabled,
        }).join(' ');

        const data: Record<string, unknown> = {
          key: `day-${i}`,
          class: classes,
          attrs: { 'data-testid': cell.isCurrentMonth ? `dp-day-${cell.dayOfMonth}` : undefined },
          on: {
            click: () => {
              if (cell.isCurrentMonth && !isDisabled) selectDate(cell.date);
            },
          },
        };
        return h('div', data, String(cell.dayOfMonth));
      });

      // Vue 2: no Teleport → inline popup render with position: fixed
      const children: ReturnType<typeof h>[] = [
        h(
          'div',
          {
            class: triggerClass.value,
          },
          [
            h('span', { class: 'cx-ui-date-picker__value-text' }, triggerChildren),
            ...(props.clearable && props.value !== undefined
              ? [
                  h(
                    'span',
                    { class: 'cx-ui-date-picker__clear', on: { mousedown: clearValue } },
                    '✕',
                  ),
                ]
              : []),
            h('span', { class: 'cx-ui-date-picker__icon' }, '📅'),
          ],
        ),
      ];

      if (lifecycle.visible.value) {
        children.push(
          h(
            'div',
            {
              ref: lifecycle.popupRef,
              class: resolveDatePickerPanelClassList({ open: true }).join(' '),
              style: lifecycle.popupStyle.value,
              on: { ...lifecycle.popupHandlers },
              attrs: { 'data-testid': 'date-picker-panel' },
            },
            [
              h('div', { class: resolveDatePickerHeaderClassList().join(' ') }, [
                h(
                  'button',
                  {
                    class: 'cx-ui-date-picker__header-btn',
                    on: { click: goPrevMonth },
                    attrs: { 'data-testid': 'dp-prev-month' },
                  },
                  '‹',
                ),
                h('span', { class: 'cx-ui-date-picker__header-label' }, headerLabel.value),
                h(
                  'button',
                  {
                    class: 'cx-ui-date-picker__header-btn',
                    on: { click: goNextMonth },
                    attrs: { 'data-testid': 'dp-next-month' },
                  },
                  '›',
                ),
              ]),
              h('div', { class: 'cx-ui-date-picker__weekdays' }, weekdayNodes),
              h('div', { class: 'cx-ui-date-picker__days' }, dayNodes),
            ],
          ),
        );
      }

      return h(
        'div',
        {
          ref: lifecycle.triggerRef,
          class: rootClass.value,
          attrs: {
            'data-testid':
              ((attrs as Record<string, unknown>)['data-testid'] as string) ?? 'date-picker-root',
          },
          on: { ...lifecycle.triggerHandlers, click: onTriggerClick },
        },
        children,
      );
    };
  },
});
