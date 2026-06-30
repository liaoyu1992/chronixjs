import {
  defaultDrawerProps,
  ensureChronixDrawerStyles,
  resolveDrawerDimensionStyle,
  resolveDrawerPanelClassList,
  resolveDrawerWrapperClassList,
  type DrawerPlacement,
  type ModalCloseReason,
} from '@chronixjs/ui';
import { useEffect, type HTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useModalLifecycle } from '../hooks/use-modal-lifecycle.js';

export interface ChronixDrawerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> {
  readonly show?: boolean | undefined;
  readonly placement?: DrawerPlacement;
  readonly title?: string | undefined;
  readonly mask?: boolean;
  readonly maskClosable?: boolean;
  readonly escClosable?: boolean;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly disabled?: boolean;
  readonly footer?: ReactNode;
  readonly children?: ReactNode;
  readonly onShowChange?: (show: boolean) => void;
  readonly onClose?: (reason: ModalCloseReason) => void;
}

export function ChronixDrawer(props: ChronixDrawerProps): React.ReactElement | null {
  const {
    show = undefined,
    placement = defaultDrawerProps.placement,
    title,
    mask = defaultDrawerProps.mask,
    maskClosable = defaultDrawerProps.maskClosable,
    escClosable = defaultDrawerProps.escClosable,
    width = defaultDrawerProps.width,
    height = defaultDrawerProps.height,
    disabled = defaultDrawerProps.disabled,
    footer,
    children,
    onShowChange,
    onClose,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixDrawerStyles();
  }, []);

  const lifecycle = useModalLifecycle({
    show,
    maskClosable,
    escClosable,
    disabled,
    onVisibilityChange: onShowChange,
    onClose,
  });

  if (!lifecycle.visible || lifecycle.portalTarget === null) return null;

  const wrapperClass = resolveDrawerWrapperClassList({
    open: true,
    mask,
    placement,
  }).join(' ');
  const panelClass = resolveDrawerPanelClassList({ placement }).join(' ');
  const panelStyle = resolveDrawerDimensionStyle({
    placement,
    width,
    height,
  });

  return createPortal(
    <div {...rest} className={wrapperClass} style={lifecycle.wrapperStyle}>
      {mask ? <div className="cx-ui-drawer__mask" onClick={lifecycle.onMaskClick} /> : null}
      <div ref={lifecycle.panelRef} className={panelClass} tabIndex={-1} style={panelStyle}>
        <div className="cx-ui-drawer__header">
          <span className="cx-ui-drawer__title">{title ?? ''}</span>
          <button
            type="button"
            className="cx-ui-drawer__close"
            aria-label="Close"
            onClick={lifecycle.onCloseButtonClick}
          >
            ×
          </button>
        </div>
        <div className="cx-ui-drawer__body">{children}</div>
        {footer !== undefined ? <div className="cx-ui-drawer__footer">{footer}</div> : null}
      </div>
    </div>,
    lifecycle.portalTarget,
  );
}
