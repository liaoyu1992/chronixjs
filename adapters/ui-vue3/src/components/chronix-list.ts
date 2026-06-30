import {
  defaultListProps,
  ensureChronixListStyles,
  resolveListClassList,
  resolveListItemClassList,
  type ListItem,
  type ListSize,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixList>` — Vue 3 SFC wrapping the core `ListProps` IR.
 * . Tier A vertical settings / contact /
 * file-row list display.
 *
 * Root element is `<ul>` (not `<div>`) — friction note
 * about `<ul>` user-agent reset applies via the core stylesheet.
 *
 * No slots, no emits — List is a pure-visual array-driven
 * primitive (D.1).
 */
export const ChronixList = defineComponent({
  name: 'ChronixList',
  props: {
    items: {
      type: Array as PropType<readonly ListItem[]>,
      default: (): readonly ListItem[] => defaultListProps.items,
    },
    bordered: {
      type: Boolean,
      default: defaultListProps.bordered,
    },
    hoverable: {
      type: Boolean,
      default: defaultListProps.hoverable,
    },
    showDivider: {
      type: Boolean,
      default: defaultListProps.showDivider,
    },
    size: {
      type: String as PropType<ListSize>,
      default: defaultListProps.size,
    },
  },
  setup(props) {
    ensureChronixListStyles();

    const resolvedProps = computed(() => ({
      items: props.items,
      bordered: props.bordered,
      hoverable: props.hoverable,
      showDivider: props.showDivider,
      size: props.size,
    }));

    return () => {
      const classList = resolveListClassList(resolvedProps.value);
      const items = resolvedProps.value.items;

      const children: VNode[] = items.map((item) => {
        const itemClasses = resolveListItemClassList(item);

        const mainChildren: VNode[] = [h('div', { class: 'cx-ui-list__title' }, item.title)];
        if (item.description !== undefined) {
          mainChildren.push(h('div', { class: 'cx-ui-list__description' }, item.description));
        }

        const liChildren: VNode[] = [];
        if (item.prefix !== undefined) {
          liChildren.push(h('div', { class: 'cx-ui-list__prefix' }, item.prefix));
        }
        liChildren.push(h('div', { class: 'cx-ui-list__main' }, mainChildren));
        if (item.suffix !== undefined) {
          liChildren.push(h('div', { class: 'cx-ui-list__suffix' }, item.suffix));
        }

        return h('li', { key: item.key, class: itemClasses }, liChildren);
      });

      return h('ul', { class: classList }, children);
    };
  },
});
