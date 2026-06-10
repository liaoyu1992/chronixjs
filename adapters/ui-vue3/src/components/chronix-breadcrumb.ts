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
 * `<ChronixBreadcrumb>` — Vue 3 SFC wrapping the core `BreadcrumbProps`
 * IR. Phase 19 (2026-06-02). Tier A navigation primitive.
 *
 * Slots:
 *
 * - `separator` — overrides the `separator` string prop when supplied.
 *
 * Emits:
 *
 * - `item-click` — fires when a clickable item is clicked. Payload is
 *   the `BreadcrumbItem` from `props.items`. Native `<a href>`
 *   navigation is NOT suppressed; consumers wanting SPA routing call
 *   `event.preventDefault()` via a `.native` modifier or wrapping
 *   handler.
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
                href: item.href,
                onClick: () => handleItemClick(item),
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
                role: 'link',
                tabindex: 0,
                onClick: () => handleItemClick(item),
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
                'aria-hidden': 'true',
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
          'aria-label': 'Breadcrumb',
        },
        children,
      );
    };
  },
});
