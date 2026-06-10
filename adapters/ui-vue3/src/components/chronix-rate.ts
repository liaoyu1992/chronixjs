import {
  defaultRateProps,
  ensureChronixRateStyles,
  resolveRateClassList,
  resolveRateStarState,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

const STAR_SVG_PATH =
  'M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.77l-5.2 2.73.99-5.78L1.58 7.62l5.82-.85L10 1.5z';

export const ChronixRate = defineComponent({
  name: 'ChronixRate',
  props: {
    value: { type: Number, default: defaultRateProps.value },
    count: { type: Number, default: defaultRateProps.count },
    allowHalf: { type: Boolean, default: defaultRateProps.allowHalf },
    disabled: { type: Boolean, default: defaultRateProps.disabled },
    readonly: { type: Boolean, default: defaultRateProps.readonly },
    error: {
      type: String as PropType<string | undefined>,
      default: defaultRateProps.error,
    },
  },
  emits: {
    'update:value': (_value: number) => true,
  },
  setup(props, { emit }) {
    ensureChronixRateStyles();
    const classList = computed(() =>
      resolveRateClassList({
        value: props.value,
        count: props.count,
        allowHalf: props.allowHalf,
        disabled: props.disabled,
        readonly: props.readonly,
        error: props.error,
      }),
    );

    function onStarClick(index: number, event: MouseEvent) {
      if (props.disabled || props.readonly) return;
      const target = event.currentTarget as HTMLElement;
      const width = target.getBoundingClientRect().width;
      let next: number;
      if (props.allowHalf && event.offsetX < width / 2) {
        next = index + 0.5;
      } else {
        next = index + 1;
      }
      emit('update:value', next);
    }

    return () => {
      const stars: VNode[] = [];
      for (let i = 0; i < props.count; i++) {
        const state = resolveRateStarState(i, props.value, props.allowHalf);
        stars.push(
          h(
            'button',
            {
              type: 'button',
              class: ['cx-ui-rate__star', `cx-ui-rate__star--${state}`],
              'data-rate-index': i,
              disabled: props.disabled,
              onClick: (e: MouseEvent) => onStarClick(i, e),
            },
            [
              h(
                'svg',
                {
                  viewBox: '0 0 20 20',
                  'aria-hidden': 'true',
                },
                [h('path', { d: STAR_SVG_PATH, fill: 'currentColor' })],
              ),
            ],
          ),
        );
      }
      if (props.error !== undefined) {
        stars.push(h('span', { class: 'cx-ui-rate__error' }, props.error));
      }
      return h('div', { class: classList.value }, stars);
    };
  },
});
