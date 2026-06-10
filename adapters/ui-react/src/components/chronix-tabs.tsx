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
import {
  useEffect,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';

export interface ChronixTabsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  readonly value?: string;
  readonly items?: readonly TabItem[];
  readonly type?: TabsType;
  readonly placement?: TabsPlacement;
  readonly size?: TabsSize;
  readonly disabled?: boolean;
  readonly addable?: boolean;
  readonly draggable?: boolean;
  readonly onValueChange?: (value: string) => void;
  readonly onChange?: (item: TabItem) => void;
  readonly onClose?: (item: TabItem) => void;
  readonly onAdd?: () => void;
  readonly onReorder?: (nextItems: readonly TabItem[]) => void;
}

export function ChronixTabs(props: ChronixTabsProps): JSX.Element {
  const {
    value,
    items = defaultTabsProps.items,
    type = defaultTabsProps.type,
    placement = defaultTabsProps.placement,
    size = defaultTabsProps.size,
    disabled = defaultTabsProps.disabled,
    addable = defaultTabsProps.addable,
    draggable = defaultTabsProps.draggable,
    onValueChange,
    onChange,
    onClose,
    onAdd,
    onReorder,
    ...rest
  } = props;
  useEffect(() => {
    ensureChronixTabsStyles();
  }, []);

  const rootClass = resolveTabsClassList({ type, placement, size, disabled }).join(' ');
  const activeItem = value !== undefined ? findTabItemByKey(items, value) : undefined;

  const [dragSourceKey, setDragSourceKey] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  function emitSelection(item: TabItem): void {
    if (item.disabled || disabled) return;
    onValueChange?.(item.key);
    onChange?.(item);
  }

  function handleCloseClick(event: React.MouseEvent, item: TabItem): void {
    event.stopPropagation();
    onClose?.(item);
  }

  function handleAddClick(): void {
    onAdd?.();
  }

  function handleDragStart(event: React.DragEvent, key: string): void {
    if (!draggable || disabled) return;
    setDragSourceKey(key);
    event.dataTransfer.setData('text/plain', key);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(event: React.DragEvent, key: string): void {
    if (!draggable || disabled) return;
    if (dragSourceKey === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTargetKey(key);
  }

  function handleDrop(event: React.DragEvent, targetKey: string): void {
    event.preventDefault();
    if (dragSourceKey === null) return;
    const nextItems = reorderTabItems(items, dragSourceKey, targetKey);
    if (nextItems !== items) {
      onReorder?.(nextItems);
    }
    setDragSourceKey(null);
    setDropTargetKey(null);
  }

  function handleDragEnd(): void {
    setDragSourceKey(null);
    setDropTargetKey(null);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
    if (disabled) return;
    const activatable = getActivatableTabKeys(items);
    if (activatable.length === 0) return;
    const verticalNav = tabsUsesVerticalKeyboardNav(placement);
    const key = event.key;
    const moveForward = verticalNav ? key === 'ArrowDown' : key === 'ArrowRight';
    const moveBackward = verticalNav ? key === 'ArrowUp' : key === 'ArrowLeft';
    if (!moveForward && !moveBackward && key !== 'Home' && key !== 'End') return;
    event.preventDefault();
    const currentIndex = value !== undefined ? activatable.indexOf(value) : -1;
    let targetIndex: number;
    if (key === 'Home') targetIndex = 0;
    else if (key === 'End') targetIndex = activatable.length - 1;
    else if (moveForward)
      targetIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % activatable.length;
    else
      targetIndex =
        currentIndex < 0
          ? activatable.length - 1
          : (currentIndex - 1 + activatable.length) % activatable.length;
    const targetKey = activatable[targetIndex];
    if (targetKey === undefined) return;
    const targetItem = findTabItemByKey(items, targetKey);
    if (targetItem === undefined) return;
    emitSelection(targetItem);
  }

  return (
    <div {...rest} className={rootClass} onKeyDown={onKeyDown}>
      <div className="cx-ui-tabs__bar" role="tablist">
        {items.map((item) => {
          const isActive = value === item.key;
          const isClosable = item.closable === true;
          const isDragOver = dropTargetKey === item.key;
          const tabClass = [
            ...resolveTabItemClassList({
              active: isActive,
              disabled: item.disabled,
              closable: isClosable,
            }),
            ...(isDragOver ? ['cx-ui-tabs__tab--drag-over'] : []),
          ].join(' ');
          const buttonProps: Record<string, unknown> = {
            key: item.key,
            type: 'button' as const,
            role: 'tab',
            'aria-selected': isActive ? 'true' : 'false',
            tabIndex: isActive ? 0 : -1,
            disabled: item.disabled,
            'data-tab-key': item.key,
            className: tabClass,
            onClick: () => emitSelection(item),
          };
          if (draggable && !item.disabled && !disabled) {
            buttonProps['draggable'] = true;
            buttonProps['onDragStart'] = (e: React.DragEvent) => handleDragStart(e, item.key);
            buttonProps['onDragOver'] = (e: React.DragEvent) => handleDragOver(e, item.key);
            buttonProps['onDrop'] = (e: React.DragEvent) => handleDrop(e, item.key);
            buttonProps['onDragEnd'] = handleDragEnd;
          }
          return (
            <button {...buttonProps}>
              {item.label}
              {isClosable && (
                <span className="cx-ui-tabs__tab-close" onClick={(e) => handleCloseClick(e, item)}>
                  ×
                </span>
              )}
            </button>
          );
        })}
        {addable && (
          <button
            type="button"
            className={resolveTabsAddButtonClassList().join(' ')}
            onClick={handleAddClick}
          >
            +
          </button>
        )}
      </div>
      <div className="cx-ui-tabs__panel" role="tabpanel">
        {activeItem?.content ?? ''}
      </div>
    </div>
  );
}
