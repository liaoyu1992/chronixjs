import {
  defaultAffixProps,
  ensureChronixAffixStyles,
  resolveAffixClassList,
  resolveAffixState,
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

/**
 * `<ChronixAffix>` — Vue 3 scroll-position-driven affix. Phase 27
 * (2026-06-03). Renders a placeholder + content; on scroll past the
 * `top` / `bottom` threshold, content gets `position: fixed` inline
 * styles.
 */
export const ChronixAffix = defineComponent({
  name: 'ChronixAffix',
  props: {
    top: {
      type: Number as PropType<number | undefined>,
      default: defaultAffixProps.top,
    },
    bottom: {
      type: Number as PropType<number | undefined>,
      default: defaultAffixProps.bottom,
    },
  },
  emits: {
    change: (_affixed: boolean) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixAffixStyles();
    const placeholderRef = ref<HTMLElement | null>(null);
    const affixed = ref(false);
    const inlineStyle = ref<Record<string, string>>({});
    const placeholderHeight = ref(0);

    function recompute(): void {
      if (typeof window === 'undefined') return;
      const el = placeholderRef.value;
      if (el === null) return;
      const rect = el.getBoundingClientRect();
      placeholderHeight.value = rect.height;
      const result = resolveAffixState({
        top: props.top,
        bottom: props.bottom,
        placeholderRect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          width: rect.width,
        },
        viewportHeight: window.innerHeight,
      });
      if (result.affixed !== affixed.value) {
        affixed.value = result.affixed;
        emit('change', result.affixed);
      }
      inlineStyle.value = result.inlineStyle;
    }

    onMounted(() => {
      recompute();
      if (typeof window !== 'undefined') {
        window.addEventListener('scroll', recompute, {
          passive: true,
          capture: true,
        });
        window.addEventListener('resize', recompute);
      }
    });

    onBeforeUnmount(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', recompute, true);
        window.removeEventListener('resize', recompute);
      }
    });

    return () => {
      const contentNodes: VNode[] = slots['default'] ? slots['default']() : [];
      const placeholderStyle = affixed.value ? { height: `${placeholderHeight.value}px` } : {};
      return h(
        'div',
        {
          ref: placeholderRef,
          class: 'cx-ui-affix-placeholder',
          style: placeholderStyle,
        },
        [
          h(
            'div',
            {
              class: resolveAffixClassList({ affixed: affixed.value }),
              style: inlineStyle.value,
            },
            contentNodes,
          ),
        ],
      );
    };
  },
});
