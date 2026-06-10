import {
  defaultBackTopProps,
  ensureChronixBackTopStyles,
  getIcon,
  resolveBackTopClassList,
  resolveBackTopStyle,
  shouldShowBackTop,
  type BackTopBehavior,
} from '@chronixjs/ui';
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  type PropType,
  type VNode,
} from 'vue';

export const ChronixBackTop = defineComponent({
  name: 'ChronixBackTop',
  props: {
    visibilityThreshold: {
      type: Number,
      default: defaultBackTopProps.visibilityThreshold,
    },
    right: { type: Number, default: defaultBackTopProps.right },
    bottom: { type: Number, default: defaultBackTopProps.bottom },
    behavior: {
      type: String as PropType<BackTopBehavior>,
      default: defaultBackTopProps.behavior,
    },
  },
  emits: {
    click: (_event: MouseEvent) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixBackTopStyles();
    const visible = ref(false);

    function recompute(): void {
      if (typeof window === 'undefined') return;
      visible.value = shouldShowBackTop({
        scrollY: window.scrollY,
        visibilityThreshold: props.visibilityThreshold,
      });
    }

    onMounted(() => {
      recompute();
      if (typeof window !== 'undefined') {
        window.addEventListener('scroll', recompute, { passive: true });
        window.addEventListener('resize', recompute);
      }
    });

    onBeforeUnmount(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', recompute);
        window.removeEventListener('resize', recompute);
      }
    });

    function onClick(event: MouseEvent): void {
      emit('click', event);
      if (event.defaultPrevented) return;
      if (typeof window === 'undefined') return;
      window.scrollTo({ top: 0, behavior: props.behavior });
    }

    return () => {
      if (!visible.value) return h('span', { style: { display: 'none' } });
      const defaultSlot = slots['default'];
      const iconSpec = getIcon('chevron-up');
      const iconNode: VNode = defaultSlot
        ? h('span', { class: 'cx-ui-back-top__icon' }, defaultSlot())
        : h('span', { class: 'cx-ui-back-top__icon' }, [
            iconSpec !== undefined
              ? h(
                  'svg',
                  {
                    attrs: {
                      viewBox: iconSpec.viewBox,
                      width: 18,
                      height: 18,
                      fill: 'currentColor',
                      'aria-hidden': 'true',
                    },
                  },
                  iconSpec.paths.map((p) =>
                    h('path', {
                      attrs: {
                        d: p.d,
                        ...(p.fillRule !== undefined ? { 'fill-rule': p.fillRule } : {}),
                      },
                    }),
                  ),
                )
              : '↑',
          ]);
      return h(
        'button',
        {
          class: resolveBackTopClassList({ visible: visible.value }),
          attrs: { type: 'button' },
          style: resolveBackTopStyle({
            right: props.right,
            bottom: props.bottom,
          }),
          on: { click: onClick },
        },
        [iconNode],
      );
    };
  },
});
