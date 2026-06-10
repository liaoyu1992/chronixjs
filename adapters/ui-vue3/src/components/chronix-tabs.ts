import {
  defaultTabsProps,
  ensureChronixTabsStyles,
  findTabItemByKey,
  getActivatableTabKeys,
  reorderTabItems,
  resolveTabItemClassList,
  resolveTabsAddButtonClassList,
  resolveTabsClassList,
  tabsUsesVerticalKeyboardNav,
  type TabItem,
  type TabsPlacement,
  type TabsSize,
  type TabsType,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type PropType, type VNode } from 'vue';

/**
 * `<ChronixTabs>` — Vue 3. Phase 28 (2026-06-04). Items-array tabs
 * (no sub-component for panes). Keyboard navigation switches direction
 * based on placement (horizontal → Left/Right; vertical → Up/Down).
 */
export const ChronixTabs = defineComponent({
  name: 'ChronixTabs',
  props: {
    value: {
      type: String as PropType<string | undefined>,
      default: defaultTabsProps.value,
    },
    items: {
      type: Array as PropType<readonly TabItem[]>,
      default: () => defaultTabsProps.items,
    },
    type: { type: String as PropType<TabsType>, default: defaultTabsProps.type },
    placement: {
      type: String as PropType<TabsPlacement>,
      default: defaultTabsProps.placement,
    },
    size: { type: String as PropType<TabsSize>, default: defaultTabsProps.size },
    disabled: { type: Boolean, default: defaultTabsProps.disabled },
    addable: { type: Boolean, default: defaultTabsProps.addable },
    draggable: { type: Boolean, default: defaultTabsProps.draggable },
  },
  emits: {
    'update:value': (_value: string) => true,
    change: (_item: TabItem) => true,
    close: (_item: TabItem) => true,
    add: () => true,
    reorder: (_nextItems: readonly TabItem[]) => true,
  },
  setup(props, { emit }) {
    ensureChronixTabsStyles();

    const rootClasses = computed(() =>
      resolveTabsClassList({
        type: props.type,
        placement: props.placement,
        size: props.size,
        disabled: props.disabled,
      }),
    );

    const activeItem = computed(() =>
      props.value !== undefined ? findTabItemByKey(props.items, props.value) : undefined,
    );

    function onTabClick(item: TabItem): void {
      if (item.disabled || props.disabled) return;
      emit('update:value', item.key);
      emit('change', item);
    }

    function onCloseClick(event: MouseEvent, item: TabItem): void {
      event.stopPropagation();
      emit('close', item);
    }

    function onAddClick(): void {
      emit('add');
    }

    // DnD
    const dragSourceKey = ref<string | null>(null);
    const dropTargetKey = ref<string | null>(null);

    function onDragStart(event: DragEvent, key: string): void {
      if (!props.draggable || props.disabled) return;
      dragSourceKey.value = key;
      event.dataTransfer!.setData('text/plain', key);
      event.dataTransfer!.effectAllowed = 'move';
    }

    function onDragOver(event: DragEvent, key: string): void {
      if (!props.draggable || props.disabled) return;
      if (dragSourceKey.value === null) return;
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'move';
      dropTargetKey.value = key;
    }

    function onDrop(event: DragEvent, targetKey: string): void {
      event.preventDefault();
      const sourceKey = dragSourceKey.value;
      if (sourceKey === null) return;
      const nextItems = reorderTabItems(props.items, sourceKey, targetKey);
      if (nextItems !== props.items) {
        emit('reorder', nextItems);
      }
      dragSourceKey.value = null;
      dropTargetKey.value = null;
    }

    function onDragEnd(): void {
      dragSourceKey.value = null;
      dropTargetKey.value = null;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (props.disabled) return;
      const activatable = getActivatableTabKeys(props.items);
      if (activatable.length === 0) return;
      const verticalNav = tabsUsesVerticalKeyboardNav(props.placement);
      const nextKey = event.key;
      const moveForward = verticalNav ? nextKey === 'ArrowDown' : nextKey === 'ArrowRight';
      const moveBackward = verticalNav ? nextKey === 'ArrowUp' : nextKey === 'ArrowLeft';
      if (!moveForward && !moveBackward && nextKey !== 'Home' && nextKey !== 'End') return;
      event.preventDefault();
      const currentIndex = props.value !== undefined ? activatable.indexOf(props.value) : -1;
      let targetIndex: number;
      if (nextKey === 'Home') targetIndex = 0;
      else if (nextKey === 'End') targetIndex = activatable.length - 1;
      else if (moveForward)
        targetIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % activatable.length;
      else
        targetIndex =
          currentIndex < 0
            ? activatable.length - 1
            : (currentIndex - 1 + activatable.length) % activatable.length;
      const targetKey = activatable[targetIndex];
      if (targetKey === undefined) return;
      const targetItem = findTabItemByKey(props.items, targetKey);
      if (targetItem === undefined) return;
      emit('update:value', targetKey);
      emit('change', targetItem);
    }

    return () => {
      const barChildren: VNode[] = props.items.map((item) => {
        const isActive = props.value === item.key;
        const isClosable = item.closable === true;
        const isDragOver = dropTargetKey.value === item.key;
        const btnChildren: (string | VNode)[] = [item.label];
        if (isClosable) {
          btnChildren.push(
            h(
              'span',
              {
                class: 'cx-ui-tabs__tab-close',
                onClick: (e: MouseEvent) => onCloseClick(e, item),
              },
              '×',
            ),
          );
        }
        const btnProps: Record<string, unknown> = {
          type: 'button',
          class: [
            ...resolveTabItemClassList({
              active: isActive,
              disabled: item.disabled,
              closable: isClosable,
            }),
            ...(isDragOver ? ['cx-ui-tabs__tab--drag-over'] : []),
          ],
          role: 'tab',
          'aria-selected': isActive ? 'true' : 'false',
          tabindex: isActive ? '0' : '-1',
          disabled: item.disabled,
          'data-tab-key': item.key,
          onClick: () => onTabClick(item),
        };
        if (props.draggable && !item.disabled && !props.disabled) {
          btnProps['draggable'] = true;
          btnProps['onDragstart'] = (e: DragEvent) => onDragStart(e, item.key);
          btnProps['onDragover'] = (e: DragEvent) => onDragOver(e, item.key);
          btnProps['onDrop'] = (e: DragEvent) => onDrop(e, item.key);
          btnProps['onDragend'] = onDragEnd;
        }
        return h('button', btnProps, btnChildren);
      });

      // Add button
      if (props.addable) {
        barChildren.push(
          h(
            'button',
            {
              type: 'button',
              class: resolveTabsAddButtonClassList(),
              onClick: onAddClick,
            },
            '+',
          ),
        );
      }

      const panelContent = activeItem.value?.content ?? '';
      return h('div', { class: rootClasses.value, onKeydown: onKeyDown }, [
        h('div', { class: 'cx-ui-tabs__bar', role: 'tablist' }, barChildren),
        h('div', { class: 'cx-ui-tabs__panel', role: 'tabpanel' }, panelContent),
      ]);
    };
  },
});
