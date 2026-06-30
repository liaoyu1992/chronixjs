import {
  defaultTimelineProps,
  ensureChronixTimelineStyles,
  resolveTimelineClassList,
  resolveTimelineItemClassList,
  type TimelineItem,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixTimeline>` — Vue 3 SFC wrapping the core `TimelineProps`
 * IR. . Tier A chronological event sequence
 * display.
 */
export const ChronixTimeline = defineComponent({
  name: 'ChronixTimeline',
  props: {
    items: {
      type: Array as PropType<readonly TimelineItem[]>,
      default: (): readonly TimelineItem[] => defaultTimelineProps.items,
    },
  },
  setup(props) {
    ensureChronixTimelineStyles();

    const resolvedProps = computed(() => ({ items: props.items }));

    return () => {
      const classList = resolveTimelineClassList(resolvedProps.value);
      const items = resolvedProps.value.items;
      const children: VNode[] = [];

      items.forEach((item, idx) => {
        const isLast = idx === items.length - 1;
        const itemClasses = resolveTimelineItemClassList(item, isLast);

        const indicatorChildren: VNode[] = [h('div', { class: 'cx-ui-timeline__dot' })];
        if (!isLast) {
          indicatorChildren.push(h('div', { class: 'cx-ui-timeline__line' }));
        }

        const contentChildren: VNode[] = [h('div', { class: 'cx-ui-timeline__title' }, item.title)];
        if (item.description !== undefined) {
          contentChildren.push(
            h('div', { class: 'cx-ui-timeline__description' }, item.description),
          );
        }
        if (item.timestamp !== undefined) {
          contentChildren.push(h('div', { class: 'cx-ui-timeline__timestamp' }, item.timestamp));
        }

        children.push(
          h('div', { key: item.key, class: itemClasses }, [
            h('div', { class: 'cx-ui-timeline__indicator' }, indicatorChildren),
            h('div', { class: 'cx-ui-timeline__content' }, contentChildren),
          ]),
        );
      });

      return h('div', { class: classList }, children);
    };
  },
});
