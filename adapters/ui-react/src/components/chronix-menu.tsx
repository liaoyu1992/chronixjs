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
import {
  useEffect,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

export interface ChronixMenuProps extends Omit<
  HTMLAttributes<HTMLUListElement>,
  'children' | 'onSelect'
> {
  readonly value?: string | undefined;
  readonly items?: readonly MenuItem[];
  readonly mode?: MenuMode;
  readonly collapsed?: boolean;
  readonly disabled?: boolean;
  readonly onValueChange?: (value: string) => void;
  readonly onSelect?: (item: MenuItem) => void;
}

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

export function ChronixMenu(props: ChronixMenuProps): React.ReactElement {
  const {
    value,
    items = defaultMenuProps.items,
    mode = defaultMenuProps.mode,
    collapsed = defaultMenuProps.collapsed,
    disabled = defaultMenuProps.disabled,
    onValueChange,
    onSelect,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixMenuStyles();
  }, []);

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(deriveInitialExpandedKeys(items, value)),
  );
  const [activeKey, setActiveKey] = useState<string | null>(value ?? null);

  useEffect(() => {
    setActiveKey(value ?? null);
  }, [value]);

  function toggleExpanded(key: string, action: 'expand' | 'collapse'): void {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (action === 'expand') next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function onItemClick(item: MenuItem): void {
    if (item.disabled || disabled) return;
    if (item.children !== undefined && item.children.length > 0) {
      toggleExpanded(item.key, expandedKeys.has(item.key) ? 'collapse' : 'expand');
      return;
    }
    setActiveKey(item.key);
    onValueChange?.(item.key);
    onSelect?.(item);
  }

  function onRootKeyDown(event: ReactKeyboardEvent<HTMLUListElement>): void {
    if (disabled) return;
    const dir = mapKeyToDirection(event.key);
    if (dir === null) return;
    event.preventDefault();
    const result = composeMenuTreeKeyboardSelection({
      items,
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
  }

  const menuClass = resolveMenuClassList({ mode, collapsed, disabled }).join(' ');

  function renderItems(list: readonly MenuItem[]): ReactNode {
    return list.map((item) => {
      const hasChildren = item.children !== undefined && item.children.length > 0;
      const expanded = hasChildren && expandedKeys.has(item.key);
      const isActive = activeKey === item.key && !hasChildren;
      const itemClass = resolveMenuItemClassList({
        hasChildren,
        expanded,
        active: isActive,
        disabled: item.disabled || disabled,
      }).join(' ');
      return (
        <li key={item.key} className={itemClass} role="menuitem">
          <div className="cx-ui-menu__item-row" onClick={() => onItemClick(item)}>
            {item.icon !== undefined ? (
              <span className="cx-ui-menu__item-icon">{item.icon}</span>
            ) : null}
            <span className="cx-ui-menu__item-label">{item.label}</span>
            {hasChildren ? <span className="cx-ui-menu__item-arrow">›</span> : null}
          </div>
          {expanded && item.children ? (
            <ul className="cx-ui-menu__submenu">{renderItems(item.children)}</ul>
          ) : null}
        </li>
      );
    });
  }

  return (
    <ul {...rest} className={menuClass} role="menubar" tabIndex={0} onKeyDown={onRootKeyDown}>
      {renderItems(items)}
    </ul>
  );
}
