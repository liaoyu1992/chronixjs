import {
  composeMenuTreeKeyboardSelection,
  defaultMenuProps,
  deriveInitialExpandedKeys,
  ensureChronixMenuStyles,
  resolveMenuClassList,
  resolveMenuItemClassList,
  type MenuItem,
  type MenuMode,
  type MenuTreeNavDirection,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, watch, type PropType, type VNode } from 'vue';

/**
 * `<ChronixMenu>` — Vue 3 inline hierarchical menu. Phase 27
 * (2026-06-03). NOT portal-mounted; sub-menus expand/collapse inline.
 *
 * Adapter owns the `expandedKeys: Set<string>` ref (initialized from
 * `deriveInitialExpandedKeys(items, value)`). Keyboard nav via
 * `composeMenuTreeKeyboardSelection`. Reactivity uses new-Set-on-
 * mutate pattern (Vue 2 / 3 / React parity).
 */
export const ChronixMenu = defineComponent({
  name: 'ChronixMenu',
  props: {
    value: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    items: {
      type: Array as PropType<readonly MenuItem[]>,
      default: () => defaultMenuProps.items,
    },
    mode: {
      type: String as PropType<MenuMode>,
      default: defaultMenuProps.mode,
    },
    collapsed: { type: Boolean, default: defaultMenuProps.collapsed },
    disabled: { type: Boolean, default: defaultMenuProps.disabled },
  },
  emits: {
    'update:value': (_value: string) => true,
    select: (_item: MenuItem) => true,
  },
  setup(props, { emit }) {
    ensureChronixMenuStyles();

    const expandedKeys = ref<Set<string>>(
      new Set(deriveInitialExpandedKeys(props.items, props.value)),
    );
    const activeKey = ref<string | null>(props.value ?? null);

    watch(
      () => props.value,
      (next) => {
        activeKey.value = next ?? null;
      },
    );

    function toggleExpanded(key: string, action: 'expand' | 'collapse'): void {
      const next = new Set(expandedKeys.value);
      if (action === 'expand') next.add(key);
      else next.delete(key);
      expandedKeys.value = next;
    }

    function onItemClick(item: MenuItem): void {
      if (item.disabled || props.disabled) return;
      if (item.children !== undefined && item.children.length > 0) {
        toggleExpanded(item.key, expandedKeys.value.has(item.key) ? 'collapse' : 'expand');
        return;
      }
      activeKey.value = item.key;
      emit('update:value', item.key);
      emit('select', item);
    }

    function onRootKeyDown(event: KeyboardEvent): void {
      if (props.disabled) return;
      const dir = mapKeyToDirection(event.key);
      if (dir === null) return;
      event.preventDefault();
      const result = composeMenuTreeKeyboardSelection({
        items: props.items,
        currentKey: activeKey.value,
        expandedKeys: expandedKeys.value,
        direction: dir,
      });
      if (result.toggleExpand !== null && activeKey.value !== null) {
        toggleExpanded(activeKey.value, result.toggleExpand);
      }
      if (result.nextKey !== null) {
        activeKey.value = result.nextKey;
      }
    }

    const menuClass = computed(() =>
      resolveMenuClassList({
        mode: props.mode,
        collapsed: props.collapsed,
        disabled: props.disabled,
      }),
    );

    function renderItems(list: readonly MenuItem[]): VNode[] {
      return list.map((item) => {
        const hasChildren = item.children !== undefined && item.children.length > 0;
        const expanded = hasChildren && expandedKeys.value.has(item.key);
        const isActive = activeKey.value === item.key && !hasChildren;
        const itemClass = resolveMenuItemClassList({
          hasChildren,
          expanded,
          active: isActive,
          disabled: item.disabled || props.disabled,
        });
        const rowChildren: VNode[] = [];
        if (item.icon !== undefined) {
          rowChildren.push(h('span', { class: 'cx-ui-menu__item-icon' }, item.icon));
        }
        rowChildren.push(h('span', { class: 'cx-ui-menu__item-label' }, item.label));
        if (hasChildren) {
          rowChildren.push(h('span', { class: 'cx-ui-menu__item-arrow' }, '›'));
        }
        const liChildren: VNode[] = [
          h(
            'div',
            {
              class: 'cx-ui-menu__item-row',
              onClick: () => onItemClick(item),
            },
            rowChildren,
          ),
        ];
        if (expanded && item.children) {
          liChildren.push(h('ul', { class: 'cx-ui-menu__submenu' }, renderItems(item.children)));
        }
        return h('li', { key: item.key, class: itemClass, role: 'menuitem' }, liChildren);
      });
    }

    return () =>
      h(
        'ul',
        {
          class: menuClass.value,
          role: 'menubar',
          tabindex: '0',
          onKeydown: onRootKeyDown,
        },
        renderItems(props.items),
      );
  },
});

function mapKeyToDirection(key: string): MenuTreeNavDirection | null {
  switch (key) {
    case 'ArrowUp':
      return 'up';
    case 'ArrowDown':
      return 'down';
    case 'ArrowLeft':
      return 'left';
    case 'ArrowRight':
      return 'right';
    case 'Home':
      return 'home';
    case 'End':
      return 'end';
    default:
      return null;
  }
}
