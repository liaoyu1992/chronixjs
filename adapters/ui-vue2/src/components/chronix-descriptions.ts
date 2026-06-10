import {
  defaultDescriptionsProps,
  ensureChronixDescriptionsStyles,
  resolveDescriptionItemSpanStyle,
  resolveDescriptionsClassList,
  resolveDescriptionsGridTemplateColumns,
  type DescriptionItem,
  type DescriptionsLabelPlacement,
  type DescriptionsSize,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixDescriptions>` — Vue 2.7 port of the Phase 21
 * Descriptions.
 *
 * Runtime differences from the vue3 sibling: `h()` second-arg data
 * object uses `style` for inline style records (kebab-case keys
 * preferred for cross-adapter consistency). DOM shape, class list,
 * slot semantics, and per-item span emission are byte-identical.
 */
export const ChronixDescriptions = defineComponent({
  name: 'ChronixDescriptions',
  props: {
    items: {
      type: Array as PropType<readonly DescriptionItem[]>,
      default: (): readonly DescriptionItem[] => defaultDescriptionsProps.items,
    },
    columns: {
      type: Number,
      default: defaultDescriptionsProps.columns,
    },
    bordered: {
      type: Boolean,
      default: defaultDescriptionsProps.bordered,
    },
    labelPlacement: {
      type: String as PropType<DescriptionsLabelPlacement>,
      default: defaultDescriptionsProps.labelPlacement,
    },
    size: {
      type: String as PropType<DescriptionsSize>,
      default: defaultDescriptionsProps.size,
    },
    title: {
      type: String as PropType<string | undefined>,
      default: defaultDescriptionsProps.title,
    },
  },
  setup(props, { slots }) {
    ensureChronixDescriptionsStyles();

    const resolvedProps = computed(() => ({
      items: props.items,
      columns: props.columns,
      bordered: props.bordered,
      labelPlacement: props.labelPlacement,
      size: props.size,
      title: props.title,
    }));

    return () => {
      const titleSlot = slots['title'];
      const titleSlotNodes = titleSlot ? titleSlot() : [];
      const hasTitle = titleSlotNodes.length > 0 || resolvedProps.value.title !== undefined;

      const classList = resolveDescriptionsClassList({
        props: resolvedProps.value,
        hasTitle,
      });

      const gridTemplateColumns = resolveDescriptionsGridTemplateColumns(
        resolvedProps.value.columns,
      );

      const children: VNode[] = [];

      if (hasTitle) {
        const titleContent = titleSlotNodes.length > 0 ? titleSlotNodes : resolvedProps.value.title;
        children.push(h('div', { class: 'cx-ui-descriptions__title' }, titleContent));
      }

      const items = resolvedProps.value.items;
      const itemNodes: VNode[] = items.map((item) => {
        const spanStyle = resolveDescriptionItemSpanStyle(item, resolvedProps.value.columns);
        const itemData: Record<string, unknown> = {
          key: item.key,
          class: 'cx-ui-descriptions__item',
        };
        if (spanStyle !== undefined) {
          itemData['style'] = { 'grid-column': spanStyle.gridColumn };
        }
        return h('div', itemData, [
          h('div', { class: 'cx-ui-descriptions__label' }, item.label),
          h('div', { class: 'cx-ui-descriptions__value' }, item.value),
        ]);
      });

      children.push(
        h(
          'div',
          {
            class: 'cx-ui-descriptions__grid',
            style: { 'grid-template-columns': gridTemplateColumns },
          },
          itemNodes,
        ),
      );

      return h('div', { class: classList }, children);
    };
  },
});
