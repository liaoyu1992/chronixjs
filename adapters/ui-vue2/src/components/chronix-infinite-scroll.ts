import {
  defaultInfiniteScrollProps,
  ensureChronixInfiniteScrollStyles,
  resolveInfiniteScrollClassList,
  type InfiniteScrollProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, type VNode } from 'vue';

/**
 * `<ChronixInfiniteScroll>` — Vue 2.7 port of the Phase 35 InfiniteScroll.
 * Verbatim surface mirror of the vue3 sibling; runtime differences are
 * Vue 2's `attrs:` data-object for HTML attributes and `on:` for events.
 * Uses IntersectionObserver in onMounted/onBeforeUnmount.
 */
export const ChronixInfiniteScroll = defineComponent({
  name: 'ChronixInfiniteScroll',
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
  setup(props, { slots, emit }) {
    ensureChronixInfiniteScrollStyles();

    const sentinelRef = ref<HTMLElement | null>(null);
    let observer: IntersectionObserver | null = null;

    const resolvedProps = computed<InfiniteScrollProps>(() => ({
      distance: props.distance,
      loading: props.loading,
    }));

    onMounted(() => {
      if (typeof IntersectionObserver === 'undefined') return;
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting && !resolvedProps.value.loading) {
            emit('load');
          }
        },
        { rootMargin: `${resolvedProps.value.distance}px` },
      );
      if (sentinelRef.value) {
        observer.observe(sentinelRef.value);
      }
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

      children.push(
        h('div', { class: 'cx-ui-infinite-scroll__content' }, [
          ...(defaultSlot ? defaultSlot() : []),
        ]),
      );

      if (resolvedProps.value.loading) {
        children.push(h('div', { class: 'cx-ui-infinite-scroll__loading' }, 'Loading...'));
      }

      children.push(
        h('div', {
          class: 'cx-ui-infinite-scroll__sentinel',
          ref: sentinelRef,
        }),
      );

      return h('div', { class: resolveInfiniteScrollClassList() }, children);
    };
  },
});
