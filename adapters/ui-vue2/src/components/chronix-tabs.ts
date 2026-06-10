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
                on: { click: (e: MouseEvent) => onCloseClick(e, item) },
              },
              '×',
            ),
          );
        }
        const tabClass = [
          ...resolveTabItemClassList({
            active: isActive,
            disabled: item.disabled,
            closable: isClosable,
          }),
          ...(isDragOver ? ['cx-ui-tabs__tab--drag-over'] : []),
        ];
        const btnAttrs: Record<string, unknown> = {
          type: 'button',
          role: 'tab',
          'aria-selected': isActive ? 'true' : 'false',
          tabindex: isActive ? '0' : '-1',
          disabled: item.disabled,
          'data-tab-key': item.key,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const btnOn: Record<string, any> = {
          click: () => onTabClick(item),
        };
        if (props.draggable && !item.disabled && !props.disabled) {
          btnAttrs['draggable'] = true;
          btnOn['dragstart'] = (e: DragEvent) => onDragStart(e, item.key);
          btnOn['dragover'] = (e: DragEvent) => onDragOver(e, item.key);
          btnOn['drop'] = (e: DragEvent) => onDrop(e, item.key);
          btnOn['dragend'] = () => onDragEnd();
        }
        const btnData = {
          class: tabClass,
          attrs: btnAttrs,
          on: btnOn,
        };
        return h('button', btnData, btnChildren);
      });

      // Add button
      if (props.addable) {
        barChildren.push(
          h(
            'button',
            {
              class: resolveTabsAddButtonClassList(),
              attrs: { type: 'button' },
              on: { click: onAddClick },
            },
            '+',
          ),
        );
      }

      const panelContent = activeItem.value?.content ?? '';
      return h('div', { class: rootClasses.value, on: { keydown: onKeyDown } }, [
        h('div', { class: 'cx-ui-tabs__bar', attrs: { role: 'tablist' } }, barChildren),
        h('div', { class: 'cx-ui-tabs__panel', attrs: { role: 'tabpanel' } }, panelContent),
      ]);
    };
  },
});
