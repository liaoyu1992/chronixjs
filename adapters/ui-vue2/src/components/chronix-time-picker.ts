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
import { computed, defineComponent, h, ref, toRef, type PropType } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

/**
 * `<ChronixTimePicker>` — Vue 2 time picker with scrollable columns.
 * . Vue 2: no Teleport → inline popup.
 */
export const ChronixTimePicker = defineComponent({
  name: 'ChronixTimePicker',
  inheritAttrs: false,
  props: {
    value: { type: Date as PropType<Date | undefined>, default: undefined },
    format: { type: String, default: defaultTimePickerProps.format },
    placeholder: { type: String, default: defaultTimePickerProps.placeholder },
    disabled: { type: Boolean, default: defaultTimePickerProps.disabled },
    clearable: { type: Boolean, default: defaultTimePickerProps.clearable },
    hourStep: { type: Number, default: defaultTimePickerProps.hourStep },
    minuteStep: { type: Number, default: defaultTimePickerProps.minuteStep },
    secondStep: { type: Number, default: defaultTimePickerProps.secondStep },
    use12Hours: { type: Boolean, default: defaultTimePickerProps.use12Hours },
    placement: {
      type: String as PropType<PopupPlacement>,
      default: defaultTimePickerProps.placement,
    },
    isHourDisabled: {
      type: Function as PropType<((hour: number) => boolean) | undefined>,
      default: undefined,
    },
    isMinuteDisabled: {
      type: Function as PropType<((minute: number) => boolean) | undefined>,
      default: undefined,
    },
    isSecondDisabled: {
      type: Function as PropType<((second: number) => boolean) | undefined>,
      default: undefined,
    },
    show: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  },
  emits: {
    'update:show': (_show: boolean) => true,
    'update:value': (_value: Date | undefined) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixTimePickerStyles();

    const lifecycle = usePopupLifecycle({
      show: toRef(props, 'show'),
      trigger: ref('click'),
      placement: toRef(props, 'placement'),
      offset: ref(4),
      flip: ref(true),
      widthMatch: ref(false),
      disabled: toRef(props, 'disabled'),
      onVisibilityChange: (next) => {
        emit('update:show', next);
      },
    });

    const displayText = computed(() => formatTimeValue(props.value, props.format));

    const timeUnits = computed(() =>
      generateTimeUnits({
        hourStep: props.hourStep,
        minuteStep: props.minuteStep,
        secondStep: props.secondStep,
        use12Hours: props.use12Hours,
      }),
    );

    const rootClass = computed(() =>
      resolveTimePickerRootClassList({
        disabled: props.disabled,
        open: lifecycle.visible.value,
      }).join(' '),
    );

    const triggerClass = computed(() =>
      resolveTimePickerTriggerClassList({
        hasValue: props.value !== undefined,
        active: lifecycle.visible.value,
        placeholder: props.value === undefined,
      }).join(' '),
    );

    function selectHour(hour: number): void {
      if (props.isHourDisabled?.(hour)) return;
      const base = props.value ?? new Date();
      emit('update:value', setHours(base, hour));
    }

    function selectMinute(minute: number): void {
      if (props.isMinuteDisabled?.(minute)) return;
      const base = props.value ?? new Date();
      emit('update:value', setMinutes(base, minute));
    }

    function selectSecond(second: number): void {
      if (props.isSecondDisabled?.(second)) return;
      const base = props.value ?? new Date();
      emit('update:value', setSeconds(base, second));
    }

    function onTriggerClick(): void {
      if (props.disabled) return;
      emit('update:show', !lifecycle.visible.value);
    }

    function clearValue(e: MouseEvent): void {
      e.stopPropagation();
      emit('update:value', undefined);
    }

    return () => {
      const currentHour = props.value !== undefined ? getHours(props.value) : -1;
      const currentMinute = props.value !== undefined ? getMinutes(props.value) : -1;
      const currentSecond = props.value !== undefined ? getSeconds(props.value) : -1;

      const hourItems = timeUnits.value.hours.map((hour) => {
        const isSelected = hour === currentHour;
        const isDisabled = props.isHourDisabled?.(hour) ?? false;
        return h(
          'div',
          {
            key: `h-${hour}`,
            class: resolveTimePickerColumnItemClassList({ isSelected, isDisabled }).join(' '),
            on: {
              click: () => {
                if (!isDisabled) selectHour(hour);
              },
            },
            attrs: { 'data-testid': `tp-hour-${hour}` },
          },
          String(hour).padStart(2, '0'),
        );
      });

      const minuteItems = timeUnits.value.minutes.map((minute) => {
        const isSelected = minute === currentMinute;
        const isDisabled = props.isMinuteDisabled?.(minute) ?? false;
        return h(
          'div',
          {
            key: `m-${minute}`,
            class: resolveTimePickerColumnItemClassList({ isSelected, isDisabled }).join(' '),
            on: {
              click: () => {
                if (!isDisabled) selectMinute(minute);
              },
            },
            attrs: { 'data-testid': `tp-minute-${minute}` },
          },
          String(minute).padStart(2, '0'),
        );
      });

      const secondItems = timeUnits.value.seconds.map((second) => {
        const isSelected = second === currentSecond;
        const isDisabled = props.isSecondDisabled?.(second) ?? false;
        return h(
          'div',
          {
            key: `s-${second}`,
            class: resolveTimePickerColumnItemClassList({ isSelected, isDisabled }).join(' '),
            on: {
              click: () => {
                if (!isDisabled) selectSecond(second);
              },
            },
            attrs: { 'data-testid': `tp-second-${second}` },
          },
          String(second).padStart(2, '0'),
        );
      });

      // Vue 2: no Teleport → inline popup
      const children: ReturnType<typeof h>[] = [
        h('div', { class: triggerClass.value }, [
          h(
            'span',
            { class: 'cx-ui-time-picker__value-text' },
            props.value !== undefined ? displayText.value : props.placeholder || 'Select time',
          ),
          ...(props.clearable && props.value !== undefined
            ? [h('span', { class: 'cx-ui-time-picker__clear', on: { mousedown: clearValue } }, '✕')]
            : []),
          h('span', { class: 'cx-ui-time-picker__icon' }, '🕐'),
        ]),
      ];

      if (lifecycle.visible.value) {
        children.push(
          h(
            'div',
            {
              ref: lifecycle.popupRef,
              class: resolveTimePickerPanelClassList({ open: true }).join(' '),
              style: lifecycle.popupStyle.value,
              on: { ...lifecycle.popupHandlers },
              attrs: { 'data-testid': 'time-picker-panel' },
            },
            [
              h('div', { class: 'cx-ui-time-picker__columns' }, [
                h(
                  'div',
                  {
                    class: resolveTimePickerColumnClassList().join(' '),
                    attrs: { 'data-testid': 'tp-hour-column' },
                  },
                  hourItems,
                ),
                h(
                  'div',
                  {
                    class: resolveTimePickerColumnClassList().join(' '),
                    attrs: { 'data-testid': 'tp-minute-column' },
                  },
                  minuteItems,
                ),
                h(
                  'div',
                  {
                    class: resolveTimePickerColumnClassList().join(' '),
                    attrs: { 'data-testid': 'tp-second-column' },
                  },
                  secondItems,
                ),
              ]),
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
              ((attrs as Record<string, unknown>)['data-testid'] as string) ?? 'time-picker-root',
          },
          on: { ...lifecycle.triggerHandlers, click: onTriggerClick },
        },
        children,
      );
    };
  },
});
