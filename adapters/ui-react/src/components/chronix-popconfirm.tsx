import {
  defaultPopconfirmProps,
  ensureChronixPopconfirmStyles,
  resolvePopconfirmClassList,
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

export interface ChronixPopconfirmProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'title'
> {
  readonly title?: string;
  readonly positiveText?: string;
  readonly negativeText?: string;
  readonly show?: boolean | undefined;
  readonly trigger?: PopupTrigger;
  readonly placement?: PopupPlacement;
  readonly offset?: number;
  readonly flip?: boolean;
  readonly disabled?: boolean;
  readonly children?: ReactNode;
  readonly onShowChange?: (show: boolean) => void;
  readonly onPositiveClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  readonly onNegativeClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

export function ChronixPopconfirm(props: ChronixPopconfirmProps): React.ReactElement {
  const {
    title = defaultPopconfirmProps.title,
    positiveText = defaultPopconfirmProps.positiveText,
    negativeText = defaultPopconfirmProps.negativeText,
    show = undefined,
    trigger = defaultPopconfirmProps.trigger,
    placement = defaultPopconfirmProps.placement,
    offset = defaultPopconfirmProps.offset,
    flip = defaultPopconfirmProps.flip,
    disabled = defaultPopconfirmProps.disabled,
    children,
    onShowChange,
    onPositiveClick,
    onNegativeClick,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixPopconfirmStyles();
  }, []);

  const lifecycle = usePopupLifecycle({
    show,
    trigger,
    placement,
    offset,
    flip,
    widthMatch: false,
    disabled,
    onVisibilityChange: onShowChange,
  });

  const className = useMemo(
    () =>
      resolvePopconfirmClassList({
        actualPlacement: lifecycle.actualPlacement,
        open: lifecycle.visible,
      }).join(' '),
    [lifecycle.actualPlacement, lifecycle.visible],
  );

  function onPositive(event: ReactMouseEvent<HTMLButtonElement>): void {
    onPositiveClick?.(event);
    onShowChange?.(false);
  }
  function onNegative(event: ReactMouseEvent<HTMLButtonElement>): void {
    onNegativeClick?.(event);
    onShowChange?.(false);
  }

  const popconfirm =
    lifecycle.visible && lifecycle.portalTarget !== null
      ? createPortal(
          <div
            ref={lifecycle.popupRef}
            className={className}
            style={lifecycle.popupStyle}
            {...lifecycle.popupHandlers}
          >
            <div className="cx-ui-popconfirm__header">
              <svg className="cx-ui-popconfirm__icon" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M8 1.5L0.5 14.5h15L8 1.5zm0 5v3m0 2v0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="cx-ui-popconfirm__title">{title}</span>
            </div>
            <div className="cx-ui-popconfirm__actions">
              <button type="button" className="cx-ui-popconfirm__action" onClick={onNegative}>
                {negativeText}
              </button>
              <button
                type="button"
                className="cx-ui-popconfirm__action cx-ui-popconfirm__action--positive"
                onClick={onPositive}
              >
                {positiveText}
              </button>
            </div>
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
      {popconfirm}
    </span>
  );
}
