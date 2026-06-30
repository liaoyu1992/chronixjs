import {
  composeKeyboardSelection,
  defaultDropdownProps,
  ensureChronixDropdownStyles,
  findDropdownOptionByKey,
  getDropdownActivatableKeys,
  resolveDropdownClassList,
  resolveDropdownOptionClassList,
  type DropdownOption,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { usePopupLifecycle } from '../hooks/use-popup-lifecycle.js';

export interface ChronixDropdownProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'onSelect'
> {
  readonly show?: boolean | undefined;
  readonly trigger?: PopupTrigger;
  readonly placement?: PopupPlacement;
  readonly options?: readonly DropdownOption[];
  readonly disabled?: boolean;
  readonly children?: ReactNode;
  readonly onShowChange?: (show: boolean) => void;
  readonly onSelect?: (option: DropdownOption) => void;
}

export function ChronixDropdown(props: ChronixDropdownProps): React.ReactElement {
  const {
    show = undefined,
    trigger = defaultDropdownProps.trigger,
    placement = defaultDropdownProps.placement,
    options = defaultDropdownProps.options,
    disabled = defaultDropdownProps.disabled,
    children,
    onShowChange,
    onSelect,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixDropdownStyles();
  }, []);

  const lifecycle = usePopupLifecycle({
    show,
    trigger,
    placement,
    offset: 4,
    flip: true,
    widthMatch: false,
    disabled,
    onVisibilityChange: onShowChange,
  });

  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (!lifecycle.visible) setActiveKey(null);
  }, [lifecycle.visible]);

  useEffect(() => {
    if (!lifecycle.visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const keys = getDropdownActivatableKeys(options);
      if (keys.length === 0) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveKey((prev) =>
          composeKeyboardSelection({
            currentKey: prev,
            availableKeys: keys,
            direction: event.key === 'ArrowDown' ? 'down' : 'up',
            wrap: true,
          }),
        );
      } else if (event.key === 'Enter') {
        const opt = findDropdownOptionByKey(options, activeKey);
        if (opt !== null) {
          onSelect?.(opt);
          onShowChange?.(false);
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [lifecycle.visible, options, activeKey, onSelect, onShowChange]);

  const dropdownClass = resolveDropdownClassList({
    actualPlacement: lifecycle.actualPlacement,
    open: lifecycle.visible,
  }).join(' ');

  function onOptionClick(opt: DropdownOption): void {
    if (opt.disabled) return;
    onSelect?.(opt);
    onShowChange?.(false);
  }

  const popup =
    lifecycle.visible && lifecycle.portalTarget !== null
      ? createPortal(
          <div
            ref={lifecycle.popupRef}
            className={dropdownClass}
            style={lifecycle.popupStyle}
            {...lifecycle.popupHandlers}
          >
            <ul className="cx-ui-dropdown__list">
              {options.map((opt) => (
                <li
                  key={opt.key}
                  className={resolveDropdownOptionClassList({
                    active: activeKey === opt.key,
                    disabled: opt.disabled,
                  }).join(' ')}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onOptionClick(opt);
                  }}
                >
                  {opt.icon !== undefined ? (
                    <span className="cx-ui-dropdown__option-icon">{opt.icon}</span>
                  ) : null}
                  <span className="cx-ui-dropdown__option-label">{opt.label}</span>
                </li>
              ))}
            </ul>
          </div>,
          lifecycle.portalTarget,
        )
      : null;

  return (
    <span
      {...rest}
      ref={lifecycle.triggerRef}
      className="cx-ui-popover__trigger"
      {...lifecycle.triggerHandlers}
    >
      {children}
      {popup}
    </span>
  );
}
