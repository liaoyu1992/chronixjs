import {
  composeTreeKeyboardSelection,
  computeTreeReorderTransaction,
  computeTreeVirtualWindow,
  defaultTreeProps,
  detectTreeDropPosition,
  ensureChronixTreeStyles,
  filterTree,
  mergeAsyncLoadedChildren,
  normalizeExpandedKeysProp,
  resolveTreeArrowClassList,
  resolveTreeClassList,
  resolveTreeDropIndicatorClassList,
  resolveTreeRowClassList,
  resolveVisibleTreeRows,
  type TreeNodeData,
  type TreeNodeSpec,
  type TreeKeyboardDirection,
} from '@chronixjs/ui';
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
  type VNode,
} from 'vue';

export const ChronixTree = defineComponent({
  name: 'ChronixTree',
  inheritAttrs: false,
  props: {
    value: {
      type: String as PropType<string | undefined>,
      default: defaultTreeProps.value,
    },
    items: {
      type: Array as PropType<readonly TreeNodeSpec<TreeNodeData>[]>,
      default: () => defaultTreeProps.items,
    },
    expandedKeys: {
      type: [Array, Set] as PropType<ReadonlySet<string> | readonly string[] | undefined>,
      default: undefined,
    },
    selectable: { type: Boolean, default: defaultTreeProps.selectable },
    defaultExpandAll: {
      type: Boolean,
      default: defaultTreeProps.defaultExpandAll,
    },
    draggable: { type: Boolean, default: defaultTreeProps.draggable },
    virtual: { type: Boolean, default: defaultTreeProps.virtual },
    virtualItemHeight: {
      type: Number,
      default: defaultTreeProps.virtualItemHeight,
    },
    height: {
      type: [Number, String] as PropType<number | string | undefined>,
      default: defaultTreeProps.height,
    },
    loadChildren: {
      type: Function as PropType<
        | ((node: TreeNodeSpec<TreeNodeData>) => Promise<readonly TreeNodeSpec<TreeNodeData>[]>)
        | undefined
      >,
      default: defaultTreeProps.loadChildren,
    },
    filter: {
      type: String as PropType<string | undefined>,
      default: defaultTreeProps.filter,
    },
    disabled: { type: Boolean, default: defaultTreeProps.disabled },
  },
  emits: {
    'update:value': (_value: string) => true,
    'update:expandedKeys': (_keys: ReadonlySet<string>) => true,
    select: (_key: string, _node: TreeNodeSpec<TreeNodeData>) => true,
    reorder: (_nextItems: readonly TreeNodeSpec<TreeNodeData>[]) => true,
    'load-error': (_key: string, _error: unknown) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixTreeStyles();

    const mounted = ref(false);
    const localItems = ref<readonly TreeNodeSpec<TreeNodeData>[]>(props.items);
    const loadingKeys = ref<Set<string>>(new Set());
    const scrollTop = ref(0);
    const viewportHeight = ref(0);
    const viewportRef = ref<HTMLElement | null>(null);

    // expandedKeys managed locally; emit update:expandedKeys on change
    const expandedKeys = ref<ReadonlySet<string>>(
      props.defaultExpandAll
        ? expandAllKeys(props.items)
        : normalizeExpandedKeysProp(props.expandedKeys),
    );

    // If consumer passes expandedKeys, keep in sync
    watch(
      () => props.expandedKeys,
      (next) => {
        if (next !== undefined) {
          expandedKeys.value = normalizeExpandedKeysProp(next);
        }
      },
    );

    watch(
      () => props.items,
      (next) => {
        localItems.value = next;
      },
    );

    const filteredItems = computed(() => {
      if (!props.filter) return localItems.value;
      return filterTree(localItems.value, (node) => {
        const label = node.data?.label ?? String(node.key);
        return label.toLowerCase().includes(props.filter.toLowerCase());
      });
    });

    const visibleRows = computed(() =>
      resolveVisibleTreeRows({
        items: filteredItems.value,
        expandedKeys: expandedKeys.value,
      }),
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
      if (action === 'expand') {
        next.add(key);
        if (props.loadChildren !== undefined && !loadingKeys.value.has(key)) {
          const entry = visibleRows.value.find((r) => String(r.node.key) === key);
          if (entry && entry.node.children === undefined && entry.node.data?.isLeaf !== true) {
            void triggerLoadChildren(key, entry.node);
          }
        }
      } else {
        next.delete(key);
      }
      expandedKeys.value = next;
      emit('update:expandedKeys', next);
    }

    async function triggerLoadChildren(
      parentKey: string,
      node: TreeNodeSpec<TreeNodeData>,
    ): Promise<void> {
      if (!props.loadChildren) return;
      loadingKeys.value = new Set(loadingKeys.value).add(parentKey);
      try {
        const children = await props.loadChildren(node);
        if (!mounted.value) return;
        localItems.value = mergeAsyncLoadedChildren({
          items: localItems.value,
          parentKey,
          loadedChildren: children,
        });
      } catch (err) {
        if (!mounted.value) return;
        emit('load-error', parentKey, err);
      } finally {
        if (mounted.value) {
          const next = new Set(loadingKeys.value);
          next.delete(parentKey);
          loadingKeys.value = next;
        }
      }
    }

    function onRowClick(key: string): void {
      if (props.disabled) return;
      const entry = visibleRows.value.find((r) => String(r.node.key) === key);
      if (!entry) return;
      if (entry.node.data?.disabled) return;

      const hasChildren = entry.node.children !== undefined && entry.node.children.length > 0;
      if (hasChildren) {
        toggleExpanded(key, expandedKeys.value.has(key) ? 'collapse' : 'expand');
        return;
      }
      // leaf
      if (props.selectable) {
        activeKey.value = key;
        emit('update:value', key);
        emit('select', key, entry.node);
      }
    }

    // Keyboard navigation
    function mapKeyToDirection(key: string): TreeKeyboardDirection | null {
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
        case 'Enter':
        case ' ':
          return 'select';
        default:
          return null;
      }
    }

    function onRootKeyDown(event: KeyboardEvent): void {
      if (props.disabled) return;
      const dir = mapKeyToDirection(event.key);
      if (dir === null) return;
      event.preventDefault();
      const result = composeTreeKeyboardSelection({
        items: filteredItems.value,
        visibleRows: visibleRows.value,
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
      if (result.selectNext && activeKey.value !== null && props.selectable) {
        emit('update:value', activeKey.value);
        const entry = visibleRows.value.find((r) => String(r.node.key) === activeKey.value);
        if (entry) emit('select', activeKey.value, entry.node);
      }
    }

    // DnD
    const dragSourceKey = ref<string | null>(null);
    const dropHoverKey = ref<string | null>(null);
    const dropHoverPosition = ref<'before' | 'inside' | 'after' | null>(null);

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
      const row = event.currentTarget as HTMLElement;
      const rect = row.getBoundingClientRect();
      const pointerYInRow = event.clientY - rect.top;
      dropHoverKey.value = key;
      dropHoverPosition.value = detectTreeDropPosition({
        pointerYInRow,
        rowHeight: rect.height,
      });
    }

    function onDragLeave(): void {
      dropHoverKey.value = null;
      dropHoverPosition.value = null;
    }

    function onDrop(event: DragEvent, hoverKey: string): void {
      event.preventDefault();
      const sourceKey = dragSourceKey.value;
      if (sourceKey === null) return;
      const position = dropHoverPosition.value;
      if (position === null) return;

      const result = computeTreeReorderTransaction({
        sourceKey,
        hoverKey,
        hoverPosition: position,
        items: localItems.value,
      });

      if (!result.cancelled) {
        localItems.value = result.nextItems;
        emit('reorder', result.nextItems);
      }

      dragSourceKey.value = null;
      dropHoverKey.value = null;
      dropHoverPosition.value = null;
    }

    function onDragEnd(): void {
      dragSourceKey.value = null;
      dropHoverKey.value = null;
      dropHoverPosition.value = null;
    }

    // Virtual scroll
    const virtualWindow = computed(() => {
      if (!props.virtual) {
        return null;
      }
      return computeTreeVirtualWindow({
        visibleRowCount: visibleRows.value.length,
        itemHeightPx: props.virtualItemHeight,
        scrollTop: scrollTop.value,
        viewportHeight: viewportHeight.value,
      });
    });

    let scrollRaf = 0;

    function onViewportScroll(): void {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => {
        if (viewportRef.value) {
          scrollTop.value = viewportRef.value.scrollTop;
        }
      });
    }

    function onViewportResize(): void {
      if (viewportRef.value) {
        viewportHeight.value = viewportRef.value.clientHeight;
      }
    }

    let resizeObserver: ResizeObserver | null = null;

    onMounted(() => {
      mounted.value = true;
      if (viewportRef.value && props.virtual) {
        viewportHeight.value = viewportRef.value.clientHeight;
        resizeObserver = new ResizeObserver(onViewportResize);
        resizeObserver.observe(viewportRef.value);
      }
    });

    onBeforeUnmount(() => {
      mounted.value = false;
      cancelAnimationFrame(scrollRaf);
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    });

    // Render
    const rootClass = computed(() =>
      resolveTreeClassList({
        virtual: props.virtual,
        disabled: props.disabled,
      }),
    );

    function renderRow(entry: (typeof visibleRows.value)[number]): VNode {
      const key = String(entry.node.key);
      const isSelected = activeKey.value === key;
      const isDisabled = entry.node.data?.disabled === true || props.disabled;
      const isLoading = loadingKeys.value.has(key);
      const hasChildren = entry.node.children !== undefined && entry.node.children.length > 0;
      const isExpanded = hasChildren && expandedKeys.value.has(key);
      const isBranch =
        hasChildren || (entry.node.children === undefined && entry.node.data?.isLeaf !== true);
      const rowClass = resolveTreeRowClassList({
        selected: isSelected,
        disabled: isDisabled,
        loading: isLoading,
      });

      const indent = h('span', {
        class: 'cx-ui-tree__indent',
        style: { width: `${entry.depth * 20}px` },
      });

      const children: VNode[] = [indent];

      // arrow
      if (isBranch) {
        const arrowClass = resolveTreeArrowClassList({ expanded: isExpanded });
        children.push(
          h(
            'span',
            {
              class: arrowClass,
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                toggleExpanded(key, isExpanded ? 'collapse' : 'expand');
              },
            },
            '▸',
          ),
        );
      } else {
        children.push(h('span', { style: 'width:20px;flex-shrink:0' }));
      }

      // icon
      if (entry.node.data?.icon !== undefined) {
        children.push(h('span', { class: 'cx-ui-tree__icon' }, entry.node.data.icon));
      }

      // label
      children.push(h('span', { class: 'cx-ui-tree__label' }, entry.node.data?.label ?? key));

      // loading spinner
      if (isLoading) {
        children.push(h('span', { class: 'cx-ui-tree__loading-spinner' }));
      }

      // drop indicator
      const isDropTarget = dropHoverKey.value === key && dropHoverPosition.value !== null;
      if (isDropTarget) {
        const indicatorClass = resolveTreeDropIndicatorClassList({
          position: dropHoverPosition.value!,
        });
        children.push(
          h('span', {
            class: indicatorClass,
          }),
        );
      }

      const rowProps: Record<string, unknown> = {
        class: rowClass,
        tabindex: -1,
        role: 'treeitem',
        'aria-selected': isSelected || undefined,
        'aria-expanded': isBranch ? isExpanded : undefined,
        'aria-level': entry.depth + 1,
        onClick: () => onRowClick(key),
      };

      if (props.draggable && !isDisabled) {
        rowProps['draggable'] = true;
        rowProps['onDragstart'] = (e: DragEvent) => onDragStart(e, key);
        rowProps['onDragover'] = (e: DragEvent) => onDragOver(e, key);
        rowProps['onDragleave'] = onDragLeave;
        rowProps['onDrop'] = (e: DragEvent) => onDrop(e, key);
        rowProps['onDragend'] = onDragEnd;
      }

      return h('div', { key, ...rowProps }, children);
    }

    return () => {
      const rootChildren: VNode[] = [];

      if (props.virtual && virtualWindow.value) {
        const vw = virtualWindow.value;
        const spacer = h('div', {
          style: { height: `${vw.offsetTopPx}px` },
        });
        const visible = visibleRows.value.slice(vw.startIndex, vw.endIndex);
        const rows = visible.map(renderRow);
        const bottomSpacer = h('div', {
          style: {
            height: `${vw.totalHeightPx - vw.offsetTopPx - visible.length * props.virtualItemHeight}px`,
          },
        });
        rootChildren.push(spacer, ...rows, bottomSpacer);

        return h(
          'div',
          {
            ...attrs,
            class: [rootClass.value, attrs.class],
            role: 'tree',
            tabindex: 0,
            'aria-multiselectable': false,
            onKeydown: onRootKeyDown,
          },
          [
            h(
              'div',
              {
                ref: viewportRef,
                class: 'cx-ui-tree__viewport',
                style: {
                  height:
                    typeof props.height === 'number'
                      ? `${props.height}px`
                      : (props.height ?? '300px'),
                  overflowY: 'auto',
                },
                onScroll: onViewportScroll,
              },
              rootChildren,
            ),
          ],
        );
      }

      // non-virtual: flat rows
      rootChildren.push(...visibleRows.value.map(renderRow));

      return h(
        'div',
        {
          ...attrs,
          class: [rootClass.value, attrs.class],
          role: 'tree',
          tabindex: 0,
          'aria-multiselectable': false,
          onKeydown: onRootKeyDown,
        },
        rootChildren,
      );
    };
  },
});

function expandAllKeys(items: readonly TreeNodeSpec<TreeNodeData>[]): Set<string> {
  const keys = new Set<string>();
  function walk(nodes: readonly TreeNodeSpec<TreeNodeData>[]): void {
    for (const n of nodes) {
      keys.add(String(n.key));
      if (n.children) walk(n.children);
    }
  }
  walk(items);
  return keys;
}
