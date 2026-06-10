import {
  computeLazyVisibleRange,
  computeNextCarouselIndex,
  computePrevCarouselIndex,
  defaultCarouselProps,
  ensureChronixCarouselStyles,
  findCarouselItemByIndex,
  getIcon,
  resolveCarouselClassList,
  resolveCarouselDotClassList,
  resolveCarouselSlideClassList,
  resolveCarouselThumbnailClassList,
  type CarouselDirection,
  type CarouselItem,
} from '@chronixjs/ui';
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  watch,
  type PropType,
  type VNode,
} from 'vue';

export const ChronixCarousel = defineComponent({
  name: 'ChronixCarousel',
  props: {
    value: { type: Number, default: defaultCarouselProps.value },
    items: {
      type: Array as PropType<readonly CarouselItem[]>,
      default: () => defaultCarouselProps.items,
    },
    autoplay: { type: Boolean, default: defaultCarouselProps.autoplay },
    intervalMs: { type: Number, default: defaultCarouselProps.intervalMs },
    showDots: { type: Boolean, default: defaultCarouselProps.showDots },
    showArrows: { type: Boolean, default: defaultCarouselProps.showArrows },
    loop: { type: Boolean, default: defaultCarouselProps.loop },
    direction: {
      type: String as PropType<CarouselDirection>,
      default: defaultCarouselProps.direction,
    },
    lazy: { type: Boolean, default: defaultCarouselProps.lazy },
    thumbnails: { type: Boolean, default: defaultCarouselProps.thumbnails },
  },
  emits: {
    'update:value': (_index: number) => true,
    change: (_item: CarouselItem, _index: number) => true,
  },
  setup(props, { emit }) {
    ensureChronixCarouselStyles();

    let autoplayTimer: ReturnType<typeof setInterval> | null = null;

    function emitTo(nextIndex: number): void {
      const targetItem = findCarouselItemByIndex(props.items, nextIndex);
      if (targetItem === undefined) return;
      emit('update:value', nextIndex);
      emit('change', targetItem, nextIndex);
    }

    function goNext(): void {
      emitTo(
        computeNextCarouselIndex({
          currentIndex: props.value,
          totalCount: props.items.length,
          loop: props.loop,
        }),
      );
    }

    function goPrev(): void {
      emitTo(
        computePrevCarouselIndex({
          currentIndex: props.value,
          totalCount: props.items.length,
          loop: props.loop,
        }),
      );
    }

    function clearAutoplay(): void {
      if (autoplayTimer !== null) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay(): void {
      clearAutoplay();
      if (!props.autoplay) return;
      if (props.items.length <= 1) return;
      autoplayTimer = setInterval(() => goNext(), props.intervalMs);
    }

    onMounted(() => startAutoplay());
    onBeforeUnmount(() => clearAutoplay());

    watch(
      () => [props.autoplay, props.intervalMs, props.items.length],
      () => startAutoplay(),
    );

    watch(
      () => props.value,
      () => {
        if (props.autoplay) startAutoplay();
      },
    );

    const rootClasses = computed(() => resolveCarouselClassList({ direction: props.direction }));

    function renderArrowIcon(name: string): VNode {
      const spec = getIcon(name);
      if (spec === undefined) return h('span', '›');
      return h(
        'svg',
        {
          attrs: {
            viewBox: spec.viewBox,
            width: 18,
            height: 18,
            fill: 'currentColor',
            'aria-hidden': 'true',
          },
        },
        spec.paths.map((p) =>
          h('path', {
            attrs: {
              d: p.d,
              ...(p.fillRule !== undefined ? { 'fill-rule': p.fillRule } : {}),
            },
          }),
        ),
      );
    }

    return () => {
      const visibleRange = computeLazyVisibleRange({
        activeIndex: props.value,
        totalCount: props.items.length,
        lazy: props.lazy,
      });

      const slides: VNode[] = props.items
        .map((item, index) => ({ item, index }))
        .filter(({ index }) => visibleRange.includes(index))
        .map(({ item, index }) =>
          h(
            'div',
            {
              key: item.key,
              class: resolveCarouselSlideClassList({ active: index === props.value }),
              attrs: { 'data-slide-key': item.key },
            },
            item.content,
          ),
        );

      const children: VNode[] = [h('div', { class: 'cx-ui-carousel__viewport' }, slides)];

      if (props.showArrows && props.items.length > 1) {
        const prevName = props.direction === 'horizontal' ? 'chevron-left' : 'chevron-up';
        const nextName = props.direction === 'horizontal' ? 'chevron-right' : 'chevron-down';
        children.push(
          h('div', { class: 'cx-ui-carousel__arrows' }, [
            h(
              'button',
              {
                class: 'cx-ui-carousel__arrow cx-ui-carousel__arrow--prev',
                attrs: { type: 'button', 'aria-label': 'Previous' },
                on: { click: goPrev },
              },
              [renderArrowIcon(prevName)],
            ),
            h(
              'button',
              {
                class: 'cx-ui-carousel__arrow cx-ui-carousel__arrow--next',
                attrs: { type: 'button', 'aria-label': 'Next' },
                on: { click: goNext },
              },
              [renderArrowIcon(nextName)],
            ),
          ]),
        );
      }

      if (props.showDots && props.items.length > 0) {
        children.push(
          h(
            'div',
            { class: 'cx-ui-carousel__dots', attrs: { role: 'tablist' } },
            props.items.map((item, index) =>
              h('button', {
                key: item.key,
                class: resolveCarouselDotClassList({ active: index === props.value }),
                attrs: {
                  type: 'button',
                  'aria-label': `Go to slide ${index + 1}`,
                  'data-dot-index': index,
                },
                on: { click: () => emitTo(index) },
              }),
            ),
          ),
        );
      }

      if (props.thumbnails && props.items.length > 0) {
        children.push(
          h(
            'div',
            { class: 'cx-ui-carousel__thumbnails' },
            props.items.map((item, index) =>
              h(
                'button',
                {
                  key: item.key,
                  class: resolveCarouselThumbnailClassList({ active: index === props.value }),
                  attrs: { type: 'button' },
                  on: { click: () => emit('update:value', index) },
                },
                item.thumbnailLabel ?? `${index + 1}`,
              ),
            ),
          ),
        );
      }

      return h('div', { class: rootClasses.value }, children);
    };
  },
});
