import {
  computeMarqueeAnimationDurationSec,
  defaultMarqueeProps,
  ensureChronixMarqueeStyles,
  resolveMarqueeClassList,
  type MarqueeDirection,
} from '@chronixjs/ui';
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  type PropType,
  type VNode,
} from 'vue';

/**
 * `<ChronixMarquee>` — Vue 3 SFC wrapping the core `MarqueeProps`
 * IR. Phase 22 (2026-06-03). Tier A auto-scrolling content strip.
 *
 * Renders root `<div>` with an inner `__track` carrying the slot
 * content rendered TWICE (for seamless loop). Animation duration
 * is computed from the measured content size + props.speed via
 * `computeMarqueeAnimationDurationSec`; ResizeObserver re-
 * measures + recomputes on content size changes.
 *
 * No emits — Marquee is pure-visual + CSS-animated.
 */
export const ChronixMarquee = defineComponent({
  name: 'ChronixMarquee',
  props: {
    direction: {
      type: String as PropType<MarqueeDirection>,
      default: defaultMarqueeProps.direction,
    },
    speed: {
      type: Number,
      default: defaultMarqueeProps.speed,
    },
    pauseOnHover: {
      type: Boolean,
      default: defaultMarqueeProps.pauseOnHover,
    },
  },
  setup(props, { slots }) {
    ensureChronixMarqueeStyles();

    const resolvedProps = computed(() => ({
      direction: props.direction,
      speed: props.speed,
      pauseOnHover: props.pauseOnHover,
    }));

    const contentSize = ref(0);
    const trackRef = ref<HTMLDivElement | null>(null);
    let observer: ResizeObserver | null = null;

    function measureContentSize(): void {
      const track = trackRef.value;
      if (!track) return;
      const firstChild = track.firstElementChild as HTMLElement | null;
      if (!firstChild) return;
      const isHorizontal =
        resolvedProps.value.direction === 'left' || resolvedProps.value.direction === 'right';
      const rect = firstChild.getBoundingClientRect();
      contentSize.value = isHorizontal ? rect.width : rect.height;
    }

    onMounted(() => {
      measureContentSize();
      if (typeof ResizeObserver !== 'undefined' && trackRef.value) {
        observer = new ResizeObserver(() => measureContentSize());
        const firstChild = trackRef.value.firstElementChild;
        if (firstChild) observer.observe(firstChild);
      }
    });

    onBeforeUnmount(() => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    });

    return () => {
      const classList = resolveMarqueeClassList(resolvedProps.value);
      const defaultSlot = slots['default'];
      const defaultNodes: VNode[] = defaultSlot ? defaultSlot() : [];

      const durationSec = computeMarqueeAnimationDurationSec(
        contentSize.value,
        resolvedProps.value.speed,
      );
      const trackStyle: Record<string, string> = {};
      if (durationSec > 0) {
        trackStyle['animationName'] = `cx-ui-marquee-scroll-${resolvedProps.value.direction}`;
        trackStyle['animationDuration'] = `${durationSec}s`;
        trackStyle['animationTimingFunction'] = 'linear';
        trackStyle['animationIterationCount'] = 'infinite';
      }

      return h('div', { class: classList }, [
        h(
          'div',
          {
            ref: trackRef,
            class: 'cx-ui-marquee__track',
            style: trackStyle,
          },
          [
            h('div', { class: 'cx-ui-marquee__copy' }, defaultNodes),
            h('div', { class: 'cx-ui-marquee__copy', 'aria-hidden': 'true' }, defaultNodes),
          ],
        ),
      ]);
    };
  },
});
