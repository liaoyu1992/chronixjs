import {
  defaultBreadcrumbProps,
  ensureChronixBreadcrumbStyles,
  isBreadcrumbItemClickable,
  resolveBreadcrumbClassList,
  resolveBreadcrumbItemClassList,
  type BreadcrumbItem,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixBreadcrumb>` — Vue 2.7 port of the Breadcrumb.
 *
 * Runtime differences from the vue3 sibling: `h()` second-arg uses
 * nested `attrs:` for HTML attributes (`href`, `role`, `tabindex`,
 * `aria-hidden`, `aria-label`) and `on:` for click handlers. DOM
 * shape, class list, item-click contract are byte-identical.
 */
export const ChronixBreadcrumb = defineComponent({
  name: 'ChronixBreadcrumb',
  props: {
    items: {
      type: Array as PropType<readonly BreadcrumbItem[]>,
      default: (): readonly BreadcrumbItem[] => defaultBreadcrumbProps.items,
    },
    separator: {
      type: String,
      default: defaultBreadcrumbProps.separator,
    },
  },
  emits: {
    'item-click': (_item: BreadcrumbItem) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixBreadcrumbStyles();

    const resolvedProps = computed(() => ({
      items: props.items,
      separator: props.separator,
    }));

    function handleItemClick(item: BreadcrumbItem): void {
      if (!isBreadcrumbItemClickable(item)) return;
      emit('item-click', item);
    }

    return () => {
      const separatorSlot = slots['separator'];
      const separatorSlotNodes = separatorSlot ? separatorSlot() : [];
      const hasSeparatorSlot = separatorSlotNodes.length > 0;

      const classList = resolveBreadcrumbClassList(resolvedProps.value, hasSeparatorSlot);

      const items = resolvedProps.value.items;
      const children: VNode[] = [];

      items.forEach((item, idx) => {
        const isLast = idx === items.length - 1;
        const itemClasses = resolveBreadcrumbItemClassList(item, isLast);
        const clickable = isBreadcrumbItemClickable(item);

        if (item.href !== undefined) {
          children.push(
            h(
              'a',
              {
                key: item.key,
                class: itemClasses,
                attrs: { href: item.href },
                on: { click: () => handleItemClick(item) },
              },
              item.label,
            ),
          );
        } else if (clickable) {
          children.push(
            h(
              'span',
              {
                key: item.key,
                class: itemClasses,
                attrs: { role: 'link', tabindex: '0' },
                on: { click: () => handleItemClick(item) },
              },
              item.label,
            ),
          );
        } else {
          children.push(
            h(
              'span',
              {
                key: item.key,
                class: itemClasses,
              },
              item.label,
            ),
          );
        }

        if (!isLast) {
          const separatorContent = hasSeparatorSlot
            ? separatorSlotNodes
            : resolvedProps.value.separator;
          children.push(
            h(
              'span',
              {
                key: `${item.key}__sep`,
                class: 'cx-ui-breadcrumb__separator',
                attrs: { 'aria-hidden': 'true' },
              },
              separatorContent,
            ),
          );
        }
      });

      return h(
        'nav',
        {
          class: classList,
          attrs: { 'aria-label': 'Breadcrumb' },
        },
        children,
      );
    };
  },
});
