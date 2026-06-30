import {
  composeKeyboardSelection,
  defaultSelectProps,
  ensureChronixSelectStyles,
  filterSelectOptions,
  flattenSelectOptions,
  normalizeSelectValue,
  resolveSelectArrowClassList,
  resolveSelectDropdownClassList,
  resolveSelectEmptyClassList,
  resolveSelectFilterInputClassList,
  resolveSelectOptionClassList,
  resolveSelectRootClassList,
  resolveSelectTagClassList,
  resolveSelectTagCloseClassList,
  resolveSelectTriggerClassList,
  type PopupPlacement,
  type SelectOption,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { usePopupLifecycle } from '../hooks/use-popup-lifecycle.js';

export interface ChronixSelectProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'placeholder'
> {
  readonly value?: string | readonly string[] | undefined;
  readonly options?: readonly SelectOption[];
  readonly multiple?: boolean;
  readonly filterable?: boolean;
  readonly clearable?: boolean;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly virtual?: boolean;
  readonly virtualItemHeight?: number;
  readonly placement?: PopupPlacement;
  readonly show?: boolean | undefined;
  readonly onShowChange?: (show: boolean) => void;
  readonly onChange?: (value: string | string[]) => void;
}

export function ChronixSelect(props: ChronixSelectProps): React.ReactElement {
  const {
    value,
    options = defaultSelectProps.options,
    multiple = defaultSelectProps.multiple,
    filterable = defaultSelectProps.filterable,
    clearable = defaultSelectProps.clearable,
    placeholder = defaultSelectProps.placeholder,
    disabled = defaultSelectProps.disabled,
    loading = defaultSelectProps.loading,
    virtual = defaultSelectProps.virtual,
    virtualItemHeight: _virtualItemHeight = defaultSelectProps.virtualItemHeight,
    placement = defaultSelectProps.placement,
    show = undefined,
    onShowChange,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixSelectStyles();
  }, []);

  const [filterQuery, setFilterQuery] = useState('');
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
      if (!next) {
        setFilterQuery('');
        setFocusedKey(null);
      }
    },
  });

  const normalizedValue = useMemo(() => normalizeSelectValue(value, multiple), [value, multiple]);

  const filteredOptions = useMemo(
    () => filterSelectOptions(options, filterQuery),
    [options, filterQuery],
  );

  const flatEntries = useMemo(() => flattenSelectOptions(filteredOptions), [filteredOptions]);

  const activatableKeys = useMemo(
    () =>
      flatEntries
        .filter((e) => !e.isGroup && !(e.option as { disabled?: boolean }).disabled)
        .map((e) => e.option.key),
    [flatEntries],
  );

  const selectedLabels = useMemo(() => {
    const labels: string[] = [];
    for (const val of normalizedValue) {
      const entry = flatEntries.find(
        (e) => !e.isGroup && (e.option as { value: string }).value === val,
      );
      if (entry) labels.push(entry.option.label);
    }
    return labels;
  }, [normalizedValue, flatEntries]);

  const rootClassName = useMemo(
    () =>
      resolveSelectRootClassList({
        multiple,
        disabled,
        filterable,
        open: lifecycle.visible,
      }).join(' '),
    [multiple, disabled, filterable, lifecycle.visible],
  );

  const triggerClassName = useMemo(
    () =>
      resolveSelectTriggerClassList({
        hasValue: normalizedValue.length > 0,
        active: lifecycle.visible,
        placeholder: normalizedValue.length === 0 && !filterQuery,
      }).join(' '),
    [normalizedValue, lifecycle.visible, filterQuery],
  );

  const arrowClassName = useMemo(
    () => resolveSelectArrowClassList(lifecycle.visible).join(' '),
    [lifecycle.visible],
  );

  const dropdownClassName = useMemo(
    () => resolveSelectDropdownClassList({ virtual }).join(' '),
    [virtual],
  );

  const selectOption = useCallback(
    (key: string) => {
      const entry = flatEntries.find((e) => e.option.key === key);
      if (!entry || entry.isGroup) return;
      const leaf = entry.option as { value: string; disabled?: boolean };
      if (leaf.disabled) return;

      if (multiple) {
        const current = [...normalizedValue];
        const idx = current.indexOf(leaf.value);
        if (idx >= 0) {
          current.splice(idx, 1);
        } else {
          current.push(leaf.value);
        }
        onChange?.(current);
      } else {
        onChange?.(leaf.value);
        onShowChange?.(false);
      }
    },
    [flatEntries, multiple, normalizedValue, onChange, onShowChange],
  );

  const removeTag = useCallback(
    (tagValue: string) => {
      if (!multiple) return;
      const current = normalizedValue.filter((v) => v !== tagValue);
      onChange?.(current);
    },
    [multiple, normalizedValue, onChange],
  );

  const clearSelection = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      onChange?.(multiple ? [] : '');
    },
    [multiple, onChange],
  );

  const onTriggerClick = useCallback(() => {
    if (disabled) return;
    onShowChange?.(!lifecycle.visible);
  }, [disabled, lifecycle.visible, onShowChange]);

  const onFilterInput = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement> | { target: EventTarget | null }) => {
      const target = e.target as HTMLInputElement;
      setFilterQuery(target.value);
    },
    [],
  );

  const onDropdownKeydown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        onShowChange?.(false);
        return;
      }
      if (e.key === 'Enter' && focusedKey !== null) {
        e.preventDefault();
        selectOption(focusedKey);
        return;
      }
      let direction: 'up' | 'down' | 'home' | 'end' | null = null;
      if (e.key === 'ArrowDown') direction = 'down';
      else if (e.key === 'ArrowUp') direction = 'up';
      else if (e.key === 'Home') direction = 'home';
      else if (e.key === 'End') direction = 'end';
      if (direction) {
        e.preventDefault();
        const next = composeKeyboardSelection({
          currentKey: focusedKey,
          availableKeys: activatableKeys,
          direction,
          wrap: true,
        });
        if (next !== null) setFocusedKey(next);
      }
    },
    [focusedKey, activatableKeys, selectOption, onShowChange],
  );

  // ── trigger content ──
  const triggerChildren: React.ReactElement[] = [];

  if (multiple && normalizedValue.length > 0) {
    for (let i = 0; i < normalizedValue.length; i++) {
      const val = normalizedValue[i]!;
      const label = selectedLabels[i] ?? val;
      triggerChildren.push(
        <span key={`tag-${val}`} className={resolveSelectTagClassList().join(' ')}>
          <span>{label}</span>
          <span
            className={resolveSelectTagCloseClassList().join(' ')}
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
      <span className="cx-ui-select__value-text" key="value">
        {selectedLabels[0] ?? normalizedValue[0]}
      </span>,
    );
  } else {
    triggerChildren.push(
      <span className="cx-ui-select__value-text" key="placeholder">
        {placeholder}
      </span>,
    );
  }

  triggerChildren.push(
    <span key="arrow" className={arrowClassName}>
      ▾
    </span>,
  );

  if (clearable && normalizedValue.length > 0) {
    triggerChildren.push(
      <span
        key="clear"
        className="cx-ui-select__clear"
        onMouseDown={clearSelection}
        style={{
          position: 'absolute',
          right: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          cursor: 'pointer',
          fontSize: 12,
          color: '#999',
        }}
      >
        ✕
      </span>,
    );
  }

  // ── dropdown content ──
  const dropdownChildren: React.ReactElement[] = [];

  if (filterable) {
    dropdownChildren.push(
      <input
        key="filter"
        className={resolveSelectFilterInputClassList().join(' ')}
        value={filterQuery}
        onInput={onFilterInput}
        placeholder="Search..."
        data-testid="select-filter-input"
      />,
    );
  }

  if (loading) {
    dropdownChildren.push(
      <div key="loading" className="cx-ui-select__loading">
        Loading...
      </div>,
    );
  } else if (flatEntries.length === 0) {
    dropdownChildren.push(
      <div key="empty" className={resolveSelectEmptyClassList().join(' ')}>
        No results
      </div>,
    );
  } else {
    for (const entry of flatEntries) {
      const opt = entry.option;
      const isGrp = entry.isGroup;
      const leafValue = !isGrp ? (opt as { value: string }).value : undefined;
      const isSelected = leafValue !== undefined && normalizedValue.includes(leafValue);
      const isDisabled = !!(opt as { disabled?: boolean }).disabled;
      const isFocused = focusedKey === opt.key;

      const classes = resolveSelectOptionClassList({
        selected: isSelected,
        disabled: isDisabled,
        groupLabel: isGrp,
        focused: isFocused,
      }).join(' ');

      const paddingStyle =
        entry.depth > 0 ? { paddingLeft: `${8 + entry.depth * 16}px` } : undefined;

      dropdownChildren.push(
        <div
          key={opt.key}
          className={classes}
          style={paddingStyle}
          role={isGrp ? 'group' : 'option'}
          aria-selected={isSelected || undefined}
          aria-disabled={isDisabled || undefined}
          data-testid={isGrp ? undefined : `select-option-${opt.key}`}
          onMouseDown={(e) => {
            e.preventDefault();
            if (!isGrp) selectOption(opt.key);
          }}
          onMouseEnter={() => {
            if (!isGrp) setFocusedKey(opt.key);
          }}
        >
          {opt.label}
        </div>,
      );
    }
  }

  const portal =
    lifecycle.visible && lifecycle.portalTarget !== null
      ? createPortal(
          <div
            ref={lifecycle.popupRef}
            className={dropdownClassName}
            style={lifecycle.popupStyle}
            onKeyDown={onDropdownKeydown}
            {...lifecycle.popupHandlers}
            data-testid="select-dropdown-popup"
          >
            {dropdownChildren}
          </div>,
          lifecycle.portalTarget,
        )
      : null;

  return (
    <div
      {...rest}
      ref={lifecycle.triggerRef as React.RefObject<HTMLDivElement>}
      className={rootClassName}
      data-testid={((rest as Record<string, unknown>)['data-testid'] as string) ?? 'select-root'}
      {...lifecycle.triggerHandlers}
      onClick={onTriggerClick}
    >
      <div className={triggerClassName}>{triggerChildren}</div>
      {portal}
    </div>
  );
}
