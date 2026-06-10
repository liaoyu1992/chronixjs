import {
  defaultModalProps,
  ensureChronixModalStyles,
  resolveModalWidthStyle,
  resolveModalWrapperClassList,
  type ModalCloseReason,
} from '@chronixjs/ui';
import { useEffect, type HTMLAttributes, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { useModalLifecycle } from '../hooks/use-modal-lifecycle.js';

export interface ChronixModalProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
> {
  readonly show?: boolean | undefined;
  readonly title?: string | undefined;
  readonly mask?: boolean;
  readonly maskClosable?: boolean;
  readonly escClosable?: boolean;
  readonly width?: number | string;
  readonly disabled?: boolean;
  readonly header?: ReactNode;
  readonly footer?: ReactNode;
  readonly children?: ReactNode;
  readonly onShowChange?: (show: boolean) => void;
  readonly onClose?: (reason: ModalCloseReason) => void;
}

export function ChronixModal(props: ChronixModalProps): JSX.Element | null {
  const {
    show = undefined,
    title,
    mask = defaultModalProps.mask,
    maskClosable = defaultModalProps.maskClosable,
    escClosable = defaultModalProps.escClosable,
    width = defaultModalProps.width,
    disabled = defaultModalProps.disabled,
    header,
    footer,
    children,
    onShowChange,
    onClose,
    ...rest
  } = props;

  useEffect(() => {
    ensureChronixModalStyles();
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

  const wrapperClass = resolveModalWrapperClassList({
    open: true,
    mask,
  }).join(' ');

  const panelStyle = { width: resolveModalWidthStyle(width) };

  const headerNode = header ?? (
    <>
      <span className="cx-ui-modal__title">{title ?? ''}</span>
      <button
        type="button"
        className="cx-ui-modal__close"
        aria-label="Close"
        onClick={lifecycle.onCloseButtonClick}
      >
        ×
      </button>
    </>
  );

  return createPortal(
    <div {...rest} className={wrapperClass} style={lifecycle.wrapperStyle}>
      {mask ? <div className="cx-ui-modal__mask" onClick={lifecycle.onMaskClick} /> : null}
      <div ref={lifecycle.panelRef} className="cx-ui-modal" tabIndex={-1} style={panelStyle}>
        <div className="cx-ui-modal__header">{headerNode}</div>
        <div className="cx-ui-modal__body">{children}</div>
        {footer !== undefined ? <div className="cx-ui-modal__footer">{footer}</div> : null}
      </div>
    </div>,
    lifecycle.portalTarget,
  );
}
