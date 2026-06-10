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
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

export interface ChronixTreeProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onSelect' | 'onDrop'
> {
  readonly value?: string | undefined;
  readonly items?: readonly TreeNodeSpec<TreeNodeData>[];
  readonly expandedKeys?: ReadonlySet<string> | readonly string[];
  readonly selectable?: boolean;
  readonly defaultExpandAll?: boolean;
  readonly draggable?: boolean;
  readonly virtual?: boolean;
  readonly virtualItemHeight?: number;
  readonly height?: number | string;
  readonly loadChildren?: (
    node: TreeNodeSpec<TreeNodeData>,
  ) => Promise<readonly TreeNodeSpec<TreeNodeData>[]>;
  readonly filter?: string;
  readonly disabled?: boolean;
  readonly onValueChange?: (value: string) => void;
  readonly onExpandedKeysChange?: (keys: ReadonlySet<string>) => void;
  readonly onSelect?: (key: string, node: TreeNodeSpec<TreeNodeData>) => void;
  readonly onReorder?: (nextItems: readonly TreeNodeSpec<TreeNodeData>[]) => void;
  readonly onLoadError?: (key: string, error: unknown) => void;
}

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

export function ChronixTree(props: ChronixTreeProps): JSX.Element {
  const {
    value,
    items = defaultTreeProps.items,
    expandedKeys: expandedKeysProp,
    selectable = defaultTreeProps.selectable,
    defaultExpandAll = defaultTreeProps.defaultExpandAll,
    draggable = defaultTreeProps.draggable,
    virtual = defaultTreeProps.virtual,
    virtualItemHeight = defaultTreeProps.virtualItemHeight,
    height,
    loadChildren,
    filter,
    disabled = defaultTreeProps.disabled,
    onValueChange,
    onExpandedKeysChange,
    onSelect,
    onReorder,
    onLoadError,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixTreeStyles();
  }, []);

  const [localItems, setLocalItems] = useState<readonly TreeNodeSpec<TreeNodeData>[]>(items);
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);
  const [vpHeight, setVpHeight] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [expandedKeys, setExpandedKeys] = useState<ReadonlySet<string>>(() =>
    defaultExpandAll ? expandAllKeys(items) : normalizeExpandedKeysProp(expandedKeysProp),
  );

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    if (expandedKeysProp !== undefined) {
      setExpandedKeys(normalizeExpandedKeysProp(expandedKeysProp));
    }
  }, [expandedKeysProp]);

  const [activeKey, setActiveKey] = useState<string | null>(value ?? null);

  useEffect(() => {
    setActiveKey(value ?? null);
  }, [value]);

  const filteredItems = useMemo(() => {
    if (!filter) return localItems;
    return filterTree(localItems, (node) => {
      const label = node.data?.label ?? String(node.key);
      return label.toLowerCase().includes(filter.toLowerCase());
    });
  }, [localItems, filter]);

  const visibleRows = useMemo(
    () => resolveVisibleTreeRows({ items: filteredItems, expandedKeys }),
    [filteredItems, expandedKeys],
  );

  const toggleExpanded = useCallback(
    (key: string, action: 'expand' | 'collapse') => {
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        if (action === 'expand') next.add(key);
        else next.delete(key);
        onExpandedKeysChange?.(next);
        return next;
      });
    },
    [onExpandedKeysChange],
  );

  const _triggerLoad = useCallback(
    async (parentKey: string, node: TreeNodeSpec<TreeNodeData>) => {
      if (!loadChildren) return;
      setLoadingKeys((prev) => new Set(prev).add(parentKey));
      try {
        const children = await loadChildren(node);
        if (!mountedRef.current) return;
        setLocalItems((prev) =>
          mergeAsyncLoadedChildren({ items: prev, parentKey, loadedChildren: children }),
        );
      } catch (err) {
        if (!mountedRef.current) return;
        onLoadError?.(parentKey, err);
      } finally {
        if (mountedRef.current) {
          setLoadingKeys((prev) => {
            const next = new Set(prev);
            next.delete(parentKey);
            return next;
          });
        }
      }
    },
    [loadChildren, onLoadError],
  );

  const onRowClick = useCallback(
    (key: string) => {
      if (disabled) return;
      const entry = visibleRows.find((r) => String(r.node.key) === key);
      if (!entry || entry.node.data?.disabled) return;
      const hasChildren = entry.node.children !== undefined && entry.node.children.length > 0;
      if (hasChildren) {
        toggleExpanded(key, expandedKeys.has(key) ? 'collapse' : 'expand');
        return;
      }
      if (selectable) {
        setActiveKey(key);
        onValueChange?.(key);
        onSelect?.(key, entry.node);
      }
    },
    [disabled, visibleRows, expandedKeys, selectable, toggleExpanded, onValueChange, onSelect],
  );

  // DnD
  const dragSourceRef = useRef<string | null>(null);
  const [dropHoverKey, setDropHoverKey] = useState<string | null>(null);
  const [dropHoverPosition, setDropHoverPosition] = useState<'before' | 'inside' | 'after' | null>(
    null,
  );

  const onDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, key: string) => {
      if (!draggable || disabled) return;
      dragSourceRef.current = key;
      e.dataTransfer.setData('text/plain', key);
      e.dataTransfer.effectAllowed = 'move';
    },
    [draggable, disabled],
  );

  const onDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, key: string) => {
      if (!draggable || disabled || dragSourceRef.current === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = detectTreeDropPosition({
        pointerYInRow: e.clientY - rect.top,
        rowHeight: rect.height,
      });
      setDropHoverKey(key);
      setDropHoverPosition(pos);
    },
    [draggable, disabled],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>, hoverKey: string) => {
      e.preventDefault();
      const sourceKey = dragSourceRef.current;
      if (sourceKey === null || dropHoverPosition === null) return;
      const result = computeTreeReorderTransaction({
        sourceKey,
        hoverKey,
        hoverPosition: dropHoverPosition,
        items: localItems,
      });
      if (!result.cancelled) {
        setLocalItems(result.nextItems);
        onReorder?.(result.nextItems);
      }
      dragSourceRef.current = null;
      setDropHoverKey(null);
      setDropHoverPosition(null);
    },
    [dropHoverPosition, localItems, onReorder],
  );

  const onDragEnd = useCallback(() => {
    dragSourceRef.current = null;
    setDropHoverKey(null);
    setDropHoverPosition(null);
  }, []);

  // Virtual scroll
  const scrollRafRef = useRef(0);

  const onViewportScroll = useCallback(() => {
    cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(() => {
      if (viewportRef.current) {
        setScrollTop(viewportRef.current.scrollTop);
      }
    });
  }, []);

  useEffect(() => {
    if (viewportRef.current && virtual) {
      setVpHeight(viewportRef.current.clientHeight);
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => {
          if (viewportRef.current) setVpHeight(viewportRef.current.clientHeight);
        });
        ro.observe(viewportRef.current);
        return () => ro.disconnect();
      }
    }
  }, [virtual]);

  const virtualWindow = useMemo(() => {
    if (!virtual) return null;
    return computeTreeVirtualWindow({
      visibleRowCount: visibleRows.length,
      itemHeightPx: virtualItemHeight,
      scrollTop,
      viewportHeight: vpHeight,
    });
  }, [virtual, visibleRows.length, virtualItemHeight, scrollTop, vpHeight]);

  // Keyboard nav
  const onRootKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const dir = mapKeyToDirection(event.key);
      if (dir === null) return;
      event.preventDefault();
      const result = composeTreeKeyboardSelection({
        items: filteredItems,
        visibleRows,
        currentKey: activeKey,
        expandedKeys,
        direction: dir,
      });
      if (result.toggleExpand !== null && activeKey !== null) {
        toggleExpanded(activeKey, result.toggleExpand);
      }
      if (result.nextKey !== null) {
        setActiveKey(result.nextKey);
      }
      if (result.selectNext && activeKey !== null && selectable) {
        onValueChange?.(activeKey);
        const entry = visibleRows.find((r) => String(r.node.key) === activeKey);
        if (entry) onSelect?.(activeKey, entry.node);
      }
    },
    [
      disabled,
      filteredItems,
      visibleRows,
      activeKey,
      expandedKeys,
      selectable,
      toggleExpanded,
      onValueChange,
      onSelect,
    ],
  );

  const rootClass = resolveTreeClassList({ virtual, disabled }).join(' ');

  function renderRow(entry: (typeof visibleRows)[number]): ReactNode {
    const key = String(entry.node.key);
    const isSelected = activeKey === key;
    const isDisabled = entry.node.data?.disabled === true || disabled;
    const isLoading = loadingKeys.has(key);
    const hasChildren = entry.node.children !== undefined && entry.node.children.length > 0;
    const isExpanded = hasChildren && expandedKeys.has(key);
    const isBranch =
      hasChildren || (entry.node.children === undefined && entry.node.data?.isLeaf !== true);
    const rowClass = resolveTreeRowClassList({
      selected: isSelected,
      disabled: isDisabled,
      loading: isLoading,
    }).join(' ');

    const isDropTarget = dropHoverKey === key && dropHoverPosition !== null;

    const rowProps: HTMLAttributes<HTMLDivElement> & {
      'aria-selected'?: boolean | undefined;
      'aria-expanded'?: boolean | undefined;
      'aria-level': number;
    } = {
      className: rowClass,
      tabIndex: -1,
      role: 'treeitem',
      'aria-selected': isSelected || undefined,
      'aria-expanded': isBranch ? isExpanded : undefined,
      'aria-level': entry.depth + 1,
      onClick: () => onRowClick(key),
    };

    if (draggable && !isDisabled) {
      rowProps.draggable = true;
      rowProps.onDragStart = (e) => onDragStart(e, key);
      rowProps.onDragOver = (e) => onDragOver(e, key);
      rowProps.onDragLeave = () => {
        setDropHoverKey(null);
        setDropHoverPosition(null);
      };
      rowProps.onDrop = (e) => onDrop(e, key);
      rowProps.onDragEnd = onDragEnd;
    }

    return (
      <div key={key} {...rowProps}>
        <span className="cx-ui-tree__indent" style={{ width: `${entry.depth * 20}px` }} />
        {isBranch ? (
          <span
            className={resolveTreeArrowClassList({ expanded: isExpanded }).join(' ')}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(key, isExpanded ? 'collapse' : 'expand');
            }}
          >
            ▸
          </span>
        ) : (
          <span style={{ width: 20, flexShrink: 0 }} />
        )}
        {entry.node.data?.icon !== undefined ? (
          <span className="cx-ui-tree__icon">{entry.node.data.icon}</span>
        ) : null}
        <span className="cx-ui-tree__label">{entry.node.data?.label ?? key}</span>
        {isLoading ? <span className="cx-ui-tree__loading-spinner" /> : null}
        {isDropTarget ? (
          <span
            className={resolveTreeDropIndicatorClassList({ position: dropHoverPosition }).join(' ')}
          />
        ) : null}
      </div>
    );
  }

  if (virtual && virtualWindow) {
    const vw = virtualWindow;
    const visible = visibleRows.slice(vw.startIndex, vw.endIndex);
    return (
      <div
        {...rest}
        className={`${rootClass} ${rest.className ?? ''}`}
        role="tree"
        tabIndex={0}
        aria-multiselectable={false}
        onKeyDown={onRootKeyDown}
      >
        <div
          ref={viewportRef}
          className="cx-ui-tree__viewport"
          style={{
            height: typeof height === 'number' ? `${height}px` : (height ?? '300px'),
            overflowY: 'auto',
          }}
          onScroll={onViewportScroll}
        >
          <div style={{ height: vw.offsetTopPx }} />
          {visible.map(renderRow)}
          <div
            style={{
              height: vw.totalHeightPx - vw.offsetTopPx - visible.length * virtualItemHeight,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      {...rest}
      className={`${rootClass} ${rest.className ?? ''}`}
      role="tree"
      tabIndex={0}
      aria-multiselectable={false}
      onKeyDown={onRootKeyDown}
    >
      {visibleRows.map(renderRow)}
    </div>
  );
}
