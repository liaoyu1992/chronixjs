import {
  defaultPopSelectProps,
  ensureChronixPopSelectStyles,
  resolvePopSelectClassList,
  type PopSelectOption,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import {
  useEffect,
  useMemo,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { usePopupLifecycle } from '../hooks/use-popup-lifecycle.js';

export interface ChronixPopSelectProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'onChange'
> {
  readonly value?: string | undefined;
  readonly options?: readonly PopSelectOption[];
  readonly show?: boolean | undefined;
  readonly trigger?: PopupTrigger;
  readonly placement?: PopupPlacement;
  readonly offset?: number;
  readonly flip?: boolean;
  readonly widthMatch?: boolean;
  readonly disabled?: boolean;
  readonly children?: ReactNode;
  readonly onShowChange?: (show: boolean) => void;
  readonly onChange?: (value: string) => void;
}

export function ChronixPopSelect(props: ChronixPopSelectProps): React.ReactElement {
  const {
    value,
    options = defaultPopSelectProps.options,
    show = undefined,
    trigger = defaultPopSelectProps.trigger,
    placement = defaultPopSelectProps.placement,
    offset = defaultPopSelectProps.offset,
    flip = defaultPopSelectProps.flip,
    widthMatch = defaultPopSelectProps.widthMatch,
    disabled = defaultPopSelectProps.disabled,
    children,
    onShowChange,
    onChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixPopSelectStyles();
  }, []);

  const lifecycle = usePopupLifecycle({
    show,
    trigger,
    placement,
    offset,
    flip,
    widthMatch,
    disabled,
    onVisibilityChange: onShowChange,
  });

  const className = useMemo(
    () =>
      resolvePopSelectClassList({
        actualPlacement: lifecycle.actualPlacement,
        open: lifecycle.visible,
      }).join(' '),
    [lifecycle.actualPlacement, lifecycle.visible],
  );

  function onOptionClick(event: ReactMouseEvent<HTMLLIElement>, opt: PopSelectOption): void {
    event.preventDefault();
    if (opt.disabled) return;
    onChange?.(opt.value);
    onShowChange?.(false);
  }

  const popSelect =
    lifecycle.visible && lifecycle.portalTarget !== null
      ? createPortal(
          <div
            ref={lifecycle.popupRef}
            className={className}
            style={lifecycle.popupStyle}
            {...lifecycle.popupHandlers}
          >
            <ul className="cx-ui-pop-select__list">
              {options.map((opt) => (
                <li
                  key={opt.key}
                  className={
                    'cx-ui-pop-select__option' +
                    (opt.value === value ? ' cx-ui-pop-select__option--active' : '') +
                    (opt.disabled ? ' cx-ui-pop-select__option--disabled' : '')
                  }
                  onMouseDown={(e) => onOptionClick(e, opt)}
                >
                  {opt.label}
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
      {popSelect}
    </span>
  );
}
