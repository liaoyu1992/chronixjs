import {
  defaultSliderProps,
  ensureChronixSliderStyles,
  computeSliderMarks,
  resolveSliderRootClassList,
  resolveSliderThumbClassList,
  resolveSliderMarkClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type PropType } from 'vue';

/**
 * `<ChronixSlider>` — Vue 2 slider with track + thumb + marks.
 * Phase 33 (2026-06-05).
 */
export const ChronixSlider = defineComponent({
  name: 'ChronixSlider',
  inheritAttrs: false,
  props: {
    value: {
      type: [Number, Array] as PropType<number | [number, number]>,
      default: defaultSliderProps.value,
    },
    range: { type: Boolean, default: defaultSliderProps.range },
    min: { type: Number, default: defaultSliderProps.min },
    max: { type: Number, default: defaultSliderProps.max },
    step: { type: Number, default: defaultSliderProps.step },
    marks: {
      type: Object as PropType<Readonly<Record<number, { label: string }>>>,
      default: () => ({}),
    },
    disabled: { type: Boolean, default: defaultSliderProps.disabled },
    tooltip: { type: Boolean, default: defaultSliderProps.tooltip },
    vertical: { type: Boolean, default: defaultSliderProps.vertical },
  },
  emits: {
    'update:value': (_value: number | [number, number]) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixSliderStyles();
    const dragging = ref(false);

    const rootClass = computed(() =>
      resolveSliderRootClassList({ disabled: props.disabled, vertical: props.vertical }).join(' '),
    );

    const computedMarks = computed(() => computeSliderMarks(props.marks, props.min, props.max));

    function percentForValue(value: number): number {
      const range = props.max - props.min;
      if (range <= 0) return 0;
      return ((value - props.min) / range) * 100;
    }

    function onTrackClick(e: MouseEvent): void {
      if (props.disabled) return;
      const track = e.currentTarget as HTMLElement;
      const rect = track.getBoundingClientRect();
      const ratio = props.vertical
        ? 1 - (e.clientY - rect.top) / rect.height
        : (e.clientX - rect.left) / rect.width;
      const newValue = props.min + ratio * (props.max - props.min);
      // Snap to step
      const steps = Math.round((newValue - props.min) / props.step);
      const snapped = Math.min(props.max, Math.max(props.min, props.min + steps * props.step));
      emit('update:value', snapped);
    }

    return () => {
      const singleValue = typeof props.value === 'number' ? props.value : props.value[0];
      const fillPercent = percentForValue(singleValue);

      const trackChildren: ReturnType<typeof h>[] = [
        h('div', {
          class: 'cx-ui-slider__fill',
          style: props.vertical ? { height: `${fillPercent}%` } : { width: `${fillPercent}%` },
        }),
        // Thumb
        h('div', {
          class: resolveSliderThumbClassList({ dragging: dragging.value }).join(' '),
          style: props.vertical ? { bottom: `${fillPercent}%` } : { left: `${fillPercent}%` },
          attrs: { 'data-testid': 'slider-thumb' },
        }),
      ];

      // Range second thumb (if range mode)
      if (props.range && Array.isArray(props.value)) {
        trackChildren.push(
          h('div', {
            class: resolveSliderThumbClassList({ dragging: false }).join(' '),
            style: props.vertical
              ? { bottom: `${percentForValue(props.value[1])}%` }
              : { left: `${percentForValue(props.value[1])}%` },
            attrs: { 'data-testid': 'slider-thumb-2' },
          }),
        );
      }

      const rootChildren: ReturnType<typeof h>[] = [
        h(
          'div',
          {
            class: 'cx-ui-slider__track',
            attrs: { 'data-testid': 'slider-track' },
            on: { click: onTrackClick },
          },
          trackChildren,
        ),
      ];

      // Marks
      if (computedMarks.value.length > 0) {
        rootChildren.push(
          h(
            'div',
            { class: 'cx-ui-slider__marks' },
            computedMarks.value.map((mark) =>
              h(
                'div',
                {
                  key: mark.value,
                  class: resolveSliderMarkClassList({
                    active: mark.value <= singleValue,
                  }).join(' '),
                  style: props.vertical
                    ? { bottom: `${mark.percent}%` }
                    : { left: `${mark.percent}%` },
                },
                [h('span', { class: 'cx-ui-slider__mark-label' }, mark.label)],
              ),
            ),
          ),
        );
      }

      return h(
        'div',
        {
          class: rootClass.value,
          attrs: {
            ...((attrs as Record<string, unknown>)['data-testid'] != null
              ? { 'data-testid': (attrs as Record<string, unknown>)['data-testid'] as string }
              : { 'data-testid': 'slider-root' }),
          },
        },
        rootChildren,
      );
    };
  },
});
