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
 * `<ChronixMarquee>` — Vue 2.7 port of the Phase 22 Marquee.
 *
 * DOM shape + class list byte-identical to vue3 sibling. Uses
 * Vue 2.7 composition-API `onMounted` / `onBeforeUnmount` via the
 * Vue.js 2 `composition-api` posture; falls back to a 1-shot
 * `getBoundingClientRect` measurement when `ResizeObserver`
 * isn't available.
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
        trackStyle['animation-name'] = `cx-ui-marquee-scroll-${resolvedProps.value.direction}`;
        trackStyle['animation-duration'] = `${durationSec}s`;
        trackStyle['animation-timing-function'] = 'linear';
        trackStyle['animation-iteration-count'] = 'infinite';
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
            h(
              'div',
              {
                class: 'cx-ui-marquee__copy',
                attrs: { 'aria-hidden': 'true' },
              },
              defaultNodes,
            ),
          ],
        ),
      ]);
    };
  },
});
