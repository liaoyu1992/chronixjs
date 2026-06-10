import {
  defaultTreeSelectProps,
  ensureChronixTreeSelectStyles,
  normalizeSelectValue,
  resolveTreeSelectArrowClassList,
  resolveTreeSelectDropdownClassList,
  resolveTreeSelectEmptyClassList,
  resolveTreeSelectRootClassList,
  resolveTreeSelectRowClassList,
  resolveTreeSelectTagClassList,
  resolveTreeSelectTagCloseClassList,
  resolveTreeSelectTriggerClassList,
  resolveTreeSelectTreeClassList,
  resolveVisibleTreeRows,
  type PopupPlacement,
  type TreeNodeData,
  type TreeNodeSpec,
} from '@chronixjs/ui';
import { useCallback, useEffect, useMemo, useState, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

import { usePopupLifecycle } from '../hooks/use-popup-lifecycle.js';

export interface ChronixTreeSelectProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'placeholder'
> {
  readonly value?: string | readonly string[] | undefined;
  readonly data?: readonly TreeNodeSpec<TreeNodeData>[];
  readonly multiple?: boolean;
  readonly clearable?: boolean;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly expandedKeys?: readonly string[];
  readonly filterTree?: boolean;
  readonly placement?: PopupPlacement;
  readonly show?: boolean | undefined;
  readonly onShowChange?: (show: boolean) => void;
  readonly onChange?: (value: string | string[]) => void;
  readonly onExpandedKeysChange?: (keys: string[]) => void;
}

export function ChronixTreeSelect(props: ChronixTreeSelectProps): JSX.Element {
  const {
    value,
    data = defaultTreeSelectProps.data,
    multiple = defaultTreeSelectProps.multiple,
    clearable: _clearable = defaultTreeSelectProps.clearable,
    placeholder = defaultTreeSelectProps.placeholder,
    disabled = defaultTreeSelectProps.disabled,
    expandedKeys = defaultTreeSelectProps.expandedKeys,
    filterTree: _filterTree = defaultTreeSelectProps.filterTree,
    placement = defaultTreeSelectProps.placement,
    show = undefined,
    onShowChange,
    onChange,
    onExpandedKeysChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixTreeSelectStyles();
  }, []);

  const [focusedKey, setFocusedKey] = useState<string | null>(null);

  const lifecycle = usePopupLifecycle({
    show,
    trigger: 'click',
    placement,
    offset: 4,
    flip: true,
    widthMatch: true,
    disabled,
    onVisibilityChange: (next) => {
      onShowChange?.(next);
      if (!next) setFocusedKey(null);
    },
  });

  const normalizedValue = useMemo(() => normalizeSelectValue(value, multiple), [value, multiple]);
  const expandedKeySet = useMemo(() => new Set(expandedKeys), [expandedKeys]);
  const visibleRows = useMemo(
    () => resolveVisibleTreeRows({ items: data, expandedKeys: expandedKeySet }),
    [data, expandedKeySet],
  );
  const selectedLabels = useMemo(() => {
    const labels: string[] = [];
    for (const val of normalizedValue) {
      for (const row of visibleRows) {
        if (String(row.node.key) === val) {
          labels.push(row.node.data?.label ?? String(row.node.key));
          break;
        }
      }
    }
    return labels;
  }, [normalizedValue, visibleRows]);

  const rootClassName = useMemo(
    () => resolveTreeSelectRootClassList({ multiple, disabled, open: lifecycle.visible }).join(' '),
    [multiple, disabled, lifecycle.visible],
  );
  const triggerClassName = useMemo(
    () =>
      resolveTreeSelectTriggerClassList(
        normalizedValue.length > 0,
        lifecycle.visible,
        normalizedValue.length === 0,
      ).join(' '),
    [normalizedValue, lifecycle.visible],
  );
  const arrowClassName = useMemo(
    () => resolveTreeSelectArrowClassList(lifecycle.visible).join(' '),
    [lifecycle.visible],
  );

  const selectNode = useCallback(
    (key: string) => {
      if (multiple) {
        const current = [...normalizedValue];
        const idx = current.indexOf(key);
        if (idx >= 0) current.splice(idx, 1);
        else current.push(key);
        onChange?.(current);
      } else {
        onChange?.(key);
        onShowChange?.(false);
      }
    },
    [multiple, normalizedValue, onChange, onShowChange],
  );

  const toggleExpand = useCallback(
    (key: string) => {
      const set = new Set(expandedKeys);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      onExpandedKeysChange?.([...set]);
    },
    [expandedKeys, onExpandedKeysChange],
  );

  const removeTag = useCallback(
    (tagValue: string) => {
      if (!multiple) return;
      onChange?.(normalizedValue.filter((v) => v !== tagValue));
    },
    [multiple, normalizedValue, onChange],
  );

  const onTriggerClick = useCallback(() => {
    if (disabled) return;
    onShowChange?.(!lifecycle.visible);
  }, [disabled, lifecycle.visible, onShowChange]);

  // trigger children
  const triggerChildren: JSX.Element[] = [];
  if (multiple && normalizedValue.length > 0) {
    for (let i = 0; i < normalizedValue.length; i++) {
      const val = normalizedValue[i]!;
      const label = selectedLabels[i] ?? val;
      triggerChildren.push(
        <span key={`tag-${val}`} className={resolveTreeSelectTagClassList().join(' ')}>
          <span>{label}</span>
          <span
            className={resolveTreeSelectTagCloseClassList().join(' ')}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              removeTag(val);
            }}
          >
            ×
          </span>
        </span>,
      );
    }
  } else if (normalizedValue.length === 1 && !multiple) {
    triggerChildren.push(
      <span className="cx-ui-tree-select__value-text" key="value">
        {selectedLabels[0] ?? normalizedValue[0]}
      </span>,
    );
  } else {
    triggerChildren.push(
      <span className="cx-ui-tree-select__value-text" key="ph">
        {placeholder}
      </span>,
    );
  }
  triggerChildren.push(
    <span key="arrow" className={arrowClassName}>
      ▾
    </span>,
  );

  // tree rows
  const treeContent: JSX.Element[] = [];
  if (visibleRows.length === 0) {
    treeContent.push(
      <div key="empty" className={resolveTreeSelectEmptyClassList().join(' ')}>
        No data
      </div>,
    );
  } else {
    for (const row of visibleRows) {
      const key = String(row.node.key);
      const isSelected = normalizedValue.includes(key);
      const isFocused = focusedKey === key;
      const isDisabled = !!row.node.data?.disabled;
      const hasChildren = !!(row.node as { children?: unknown }).children;
      const rowClasses = resolveTreeSelectRowClassList(isSelected, isFocused, isDisabled).join(' ');
      const indentStyle = { paddingLeft: `${row.depth * 20}px` };

      const arrowInner = hasChildren ? (
        <span
          className={[
            'cx-ui-tree-select__tree-arrow',
            expandedKeySet.has(key) ? 'cx-ui-tree-select__tree-arrow--expanded' : '',
          ].join(' ')}
          onClick={(e) => {
            e.stopPropagation();
            toggleExpand(key);
          }}
        >
          ▶
        </span>
      ) : (
        <span className="cx-ui-tree-select__tree-arrow cx-ui-tree-select__tree-arrow--hidden">
          ▶
        </span>
      );

      treeContent.push(
        <div
          key={key}
          className={rowClasses}
          style={indentStyle}
          data-testid={`tree-select-row-${key}`}
          onClick={() => {
            if (!isDisabled) {
              if (hasChildren) toggleExpand(key);
              selectNode(key);
            }
          }}
          onMouseEnter={() => setFocusedKey(key)}
        >
          {arrowInner}
          <span className="cx-ui-tree-select__tree-row-content">
            {row.node.data?.label ?? String(row.node.key)}
          </span>
        </div>,
      );
    }
  }

  const portal =
    lifecycle.visible && lifecycle.portalTarget !== null
      ? createPortal(
          <div
            ref={lifecycle.popupRef}
            className={resolveTreeSelectDropdownClassList().join(' ')}
            style={lifecycle.popupStyle}
            {...lifecycle.popupHandlers}
            data-testid="tree-select-dropdown-popup"
          >
            <div className={resolveTreeSelectTreeClassList().join(' ')}>{treeContent}</div>
          </div>,
          lifecycle.portalTarget,
        )
      : null;

  return (
    <div
      {...rest}
      ref={lifecycle.triggerRef as React.RefObject<HTMLDivElement>}
      className={rootClassName}
      data-testid={
        ((rest as Record<string, unknown>)['data-testid'] as string) ?? 'tree-select-root'
      }
      {...lifecycle.triggerHandlers}
      onClick={onTriggerClick}
    >
      <div className={triggerClassName}>{triggerChildren}</div>
      {portal}
    </div>
  );
}
