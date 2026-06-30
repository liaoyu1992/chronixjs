import {
  defaultPopoverProps,
  ensureChronixPopoverStyles,
  resolvePopoverClassList,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { usePopupLifecycle } from '../hooks/use-popup-lifecycle.js';

export interface ChronixPopoverProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'onChange' | 'content'
> {
  readonly show?: boolean | undefined;
  readonly trigger?: PopupTrigger;
  readonly placement?: PopupPlacement;
  readonly offset?: number;
  readonly flip?: boolean;
  readonly widthMatch?: boolean;
  readonly disabled?: boolean;
  readonly content?: ReactNode;
  readonly children?: ReactNode;
  readonly onShowChange?: (show: boolean) => void;
}

export function ChronixPopover(props: ChronixPopoverProps): React.ReactElement {
  const {
    show = undefined,
    trigger = defaultPopoverProps.trigger,
    placement = defaultPopoverProps.placement,
    offset = defaultPopoverProps.offset,
    flip = defaultPopoverProps.flip,
    widthMatch = defaultPopoverProps.widthMatch,
    disabled = defaultPopoverProps.disabled,
    content,
    children,
    onShowChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixPopoverStyles();
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
      resolvePopoverClassList({
        actualPlacement: lifecycle.actualPlacement,
        open: lifecycle.visible,
      }).join(' '),
    [lifecycle.actualPlacement, lifecycle.visible],
  );

  const popup =
    lifecycle.visible && lifecycle.portalTarget !== null
      ? createPortal(
          <div
            ref={lifecycle.popupRef}
            className={className}
            style={lifecycle.popupStyle}
            {...lifecycle.popupHandlers}
          >
            {content}
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
