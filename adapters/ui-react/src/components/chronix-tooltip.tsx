import {
  defaultTooltipProps,
  ensureChronixTooltipStyles,
  resolveTooltipClassList,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import { useEffect, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { usePopupLifecycle } from '../hooks/use-popup-lifecycle.js';

export interface ChronixTooltipProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children' | 'content'
> {
  readonly content?: string;
  readonly show?: boolean | undefined;
  readonly trigger?: PopupTrigger;
  readonly placement?: PopupPlacement;
  readonly offset?: number;
  readonly flip?: boolean;
  readonly disabled?: boolean;
  readonly children?: ReactNode;
  readonly onShowChange?: (show: boolean) => void;
}

export function ChronixTooltip(props: ChronixTooltipProps): JSX.Element {
  const {
    content = defaultTooltipProps.content,
    show = undefined,
    trigger = defaultTooltipProps.trigger,
    placement = defaultTooltipProps.placement,
    offset = defaultTooltipProps.offset,
    flip = defaultTooltipProps.flip,
    disabled = defaultTooltipProps.disabled,
    children,
    onShowChange,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixTooltipStyles();
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
      resolveTooltipClassList({
        actualPlacement: lifecycle.actualPlacement,
        open: lifecycle.visible,
      }).join(' '),
    [lifecycle.actualPlacement, lifecycle.visible],
  );

  const tooltip =
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
      {tooltip}
    </span>
  );
}
