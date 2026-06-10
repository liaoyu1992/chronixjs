import {
  defaultInfiniteScrollProps,
  ensureChronixInfiniteScrollStyles,
  resolveInfiniteScrollClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, type VNode } from 'vue';

/**
 * `<ChronixInfiniteScroll>` — Vue 3 infinite scroll container.
 * Phase 35 (2026-06-05).
 *
 * Props:
 *
 * - `distance` — distance in px from bottom to trigger load (default 0).
 * - `loading` — whether content is currently loading (default false).
 *
 * Emits:
 *
 * - `load` — emitted when the sentinel element intersects the viewport.
 *
 * Uses IntersectionObserver on a sentinel div at the bottom of the
 * default slot content.
 */
export const ChronixInfiniteScroll = defineComponent({
  name: 'ChronixInfiniteScroll',
  inheritAttrs: false,
  props: {
    distance: {
      type: Number,
      default: defaultInfiniteScrollProps.distance,
    },
    loading: {
      type: Boolean,
      default: defaultInfiniteScrollProps.loading,
    },
  },
  emits: {
    load: () => true,
  },
  setup(props, { emit, slots }) {
    ensureChronixInfiniteScrollStyles();

    const sentinelRef = ref<HTMLElement | null>(null);
    let observer: IntersectionObserver | null = null;

    const classList = computed(() => resolveInfiniteScrollClassList());

    onMounted(() => {
      if (typeof IntersectionObserver === 'undefined') return;
      const sentinel = sentinelRef.value;
      if (!sentinel) return;

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !props.loading) {
              emit('load');
            }
          }
        },
        {
          rootMargin: `${props.distance}px`,
        },
      );
      observer.observe(sentinel);
    });

    onBeforeUnmount(() => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    });

    return () => {
      const defaultSlot = slots['default'];
      const children: VNode[] = [];

      if (defaultSlot) {
        const slotNodes = defaultSlot();
        if (Array.isArray(slotNodes)) {
          children.push(...slotNodes);
        } else {
          children.push(slotNodes);
        }
      }

      // Sentinel element observed by IntersectionObserver
      children.push(
        h('div', {
          ref: sentinelRef,
          class: 'cx-ui-infinite-scroll__sentinel',
          'data-testid': 'infinite-scroll-sentinel',
        }),
      );

      return h(
        'div',
        {
          class: classList.value,
          'data-testid': 'infinite-scroll-root',
        },
        children,
      );
    };
  },
});
