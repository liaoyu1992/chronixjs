import {
  defaultCascaderProps,
  ensureChronixCascaderStyles,
  isOptionGroup,
  normalizeSelectValue,
  resolveCascaderArrowClassList,
  resolveCascaderDropdownClassList,
  resolveCascaderOptionClassList,
  resolveCascaderPanelClassList,
  resolveCascaderPathLabels,
  resolveCascaderRootClassList,
  resolveCascaderTagClassList,
  resolveCascaderTagCloseClassList,
  resolveCascaderTriggerClassList,
  type PopupPlacement,
  type SelectOption,
  type OptionSpec,
} from '@chronixjs/ui';
import { useCallback, useEffect, useMemo, useState, type HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

import { usePopupLifecycle } from '../hooks/use-popup-lifecycle.js';

export interface ChronixCascaderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'placeholder'
> {
  readonly value?: string | readonly string[] | undefined;
  readonly options?: readonly SelectOption[];
  readonly multiple?: boolean;
  readonly clearable?: boolean;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly placement?: PopupPlacement;
  readonly show?: boolean | undefined;
  readonly onShowChange?: (show: boolean) => void;
  readonly onChange?: (value: string | string[]) => void;
}

export function ChronixCascader(props: ChronixCascaderProps): React.ReactElement {
  const {
    value,
    options = defaultCascaderProps.options,
    multiple = defaultCascaderProps.multiple,
    clearable: _clearable = defaultCascaderProps.clearable,
    placeholder = defaultCascaderProps.placeholder,
    disabled = defaultCascaderProps.disabled,
    placement = defaultCascaderProps.placement,
    show = undefined,
    onShowChange,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixCascaderStyles();
  }, []);

  const [activePath, setActivePath] = useState<string[]>([]);

  const lifecycle = usePopupLifecycle({
    show,
    trigger: 'click',
    placement,
    offset: 4,
    flip: true,
    widthMatch: false,
    disabled,
    onVisibilityChange: (next) => {
      onShowChange?.(next);
      if (!next) setActivePath([]);
    },
  });

  const normalizedValue = useMemo(() => normalizeSelectValue(value, multiple), [value, multiple]);
  const displayLabel = useMemo(() => {
    if (normalizedValue.length === 0) return '';
    if (multiple)
      return normalizedValue
        .map((v) => resolveCascaderPathLabels(options, v).join(' / '))
        .join(', ');
    return resolveCascaderPathLabels(options, normalizedValue[0]!).join(' / ');
  }, [normalizedValue, options, multiple]);

  const rootClassName = useMemo(
    () => resolveCascaderRootClassList({ multiple, disabled, open: lifecycle.visible }).join(' '),
    [multiple, disabled, lifecycle.visible],
  );
  const triggerClassName = useMemo(
    () =>
      resolveCascaderTriggerClassList(
        normalizedValue.length > 0,
        lifecycle.visible,
        normalizedValue.length === 0,
      ).join(' '),
    [normalizedValue, lifecycle.visible],
  );
  const arrowClassName = useMemo(
    () => resolveCascaderArrowClassList(lifecycle.visible).join(' '),
    [lifecycle.visible],
  );

  const panels = useMemo(() => {
    const result: { options: readonly SelectOption[]; level: number }[] = [{ options, level: 0 }];
    for (let i = 0; i < activePath.length; i++) {
      const activeKey = activePath[i]!;
      const currentOptions = result[i]!.options;
      const activeOpt = currentOptions.find((o) => o.key === activeKey);
      if (activeOpt && isOptionGroup(activeOpt) && activeOpt.children.length > 0) {
        result.push({ options: activeOpt.children, level: i + 1 });
      } else break;
    }
    return result;
  }, [options, activePath]);

  const isLeaf = useCallback((opt: SelectOption): boolean => {
    return !isOptionGroup(opt) || !opt.children || opt.children.length === 0;
  }, []);

  const onOptionClick = useCallback(
    (opt: SelectOption, level: number) => {
      setActivePath((prev) => [...prev.slice(0, level), opt.key]);
      if (isLeaf(opt)) {
        const leaf = opt as OptionSpec;
        if (leaf.disabled) return;
        if (multiple) {
          const current = [...normalizedValue];
          const idx = current.indexOf(leaf.value);
          if (idx >= 0) current.splice(idx, 1);
          else current.push(leaf.value);
          onChange?.(current);
        } else {
          onChange?.(leaf.value);
          onShowChange?.(false);
        }
      }
    },
    [isLeaf, multiple, normalizedValue, onChange, onShowChange],
  );

  const removeTag = useCallback(
    (val: string) => {
      if (!multiple) return;
      onChange?.(normalizedValue.filter((v) => v !== val));
    },
    [multiple, normalizedValue, onChange],
  );

  const onTriggerClick = useCallback(() => {
    if (disabled) return;
    onShowChange?.(!lifecycle.visible);
  }, [disabled, lifecycle.visible, onShowChange]);

  // trigger
  const triggerChildren: React.ReactElement[] = [];
  if (multiple && normalizedValue.length > 0) {
    for (const val of normalizedValue) {
      const label = resolveCascaderPathLabels(options, val).join(' / ');
      triggerChildren.push(
        <span key={`tag-${val}`} className={resolveCascaderTagClassList().join(' ')}>
          <span>{label}</span>
          <span
            className={resolveCascaderTagCloseClassList().join(' ')}
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
  } else if (displayLabel) {
    triggerChildren.push(
      <span className="cx-ui-cascader__value-text" key="value">
        {displayLabel}
      </span>,
    );
  } else {
    triggerChildren.push(
      <span className="cx-ui-cascader__value-text" key="ph">
        {placeholder}
      </span>,
    );
  }
  triggerChildren.push(
    <span key="arrow" className={arrowClassName}>
      ▾
    </span>,
  );

  // panels
  const panelNodes = panels.map((panel) => {
    const optionNodes = panel.options.map((opt) => {
      const isActive = activePath[panel.level] === opt.key;
      const leafVal = !isLeaf(opt) ? undefined : (opt as OptionSpec).value;
      const isSelected = leafVal !== undefined && normalizedValue.includes(leafVal);
      const isDisabled = !!(opt as { disabled?: boolean }).disabled;
      const classes = resolveCascaderOptionClassList(isSelected, isActive, isDisabled).join(' ');
      const children: (string | React.ReactElement)[] = [opt.label];
      if (!isLeaf(opt))
        children.push(
          <span key="arr" className="cx-ui-cascader__option-arrow">
            ›
          </span>,
        );
      return (
        <div
          key={opt.key}
          className={classes}
          data-testid={`cascader-option-${opt.key}`}
          onMouseEnter={() => setActivePath((prev) => [...prev.slice(0, panel.level), opt.key])}
          onClick={() => onOptionClick(opt, panel.level)}
        >
          {children}
        </div>
      );
    });
    return (
      <div key={`panel-${panel.level}`} className={resolveCascaderPanelClassList().join(' ')}>
        {optionNodes}
      </div>
    );
  });

  const portal =
    lifecycle.visible && lifecycle.portalTarget !== null
      ? createPortal(
          <div
            ref={lifecycle.popupRef}
            className={resolveCascaderDropdownClassList().join(' ')}
            style={lifecycle.popupStyle}
            {...lifecycle.popupHandlers}
            data-testid="cascader-dropdown-popup"
          >
            {panelNodes}
          </div>,
          lifecycle.portalTarget,
        )
      : null;

  return (
    <div
      {...rest}
      ref={lifecycle.triggerRef as React.RefObject<HTMLDivElement>}
      className={rootClassName}
      data-testid={((rest as Record<string, unknown>)['data-testid'] as string) ?? 'cascader-root'}
      {...lifecycle.triggerHandlers}
      onClick={onTriggerClick}
    >
      <div className={triggerClassName}>{triggerChildren}</div>
      {portal}
    </div>
  );
}
