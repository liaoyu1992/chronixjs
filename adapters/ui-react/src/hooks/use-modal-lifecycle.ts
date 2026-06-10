import {
  getFirstFocusable,
  getLastFocusable,
  lockBodyScroll,
  nextPopupZIndex,
  unlockBodyScroll,
} from '@chronixjs/ui';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';

import { useUIContext } from './use-ui-context.js';

/**
 * React modal/drawer lifecycle hook — Phase 27 (2026-06-03). Same
 * surface as Vue 3 / Vue 2 `useModalLifecycle` composables. Distinct
 * from Phase 26 `usePopupLifecycle` because Modal/Drawer don't have
 * an anchor (no placement math); they pin to the viewport via
 * `position: fixed; inset: 0`.
 */

export type ModalCloseReason = 'mask' | 'esc' | 'close-button';

export interface UseModalLifecycleArgs {
  readonly show: boolean | undefined;
  readonly maskClosable: boolean;
  readonly escClosable: boolean;
  readonly disabled: boolean;
  readonly onVisibilityChange: ((next: boolean) => void) | undefined;
  readonly onClose: ((reason: ModalCloseReason) => void) | undefined;
}

export interface UseModalLifecycleReturn {
  readonly panelRef: RefObject<HTMLDivElement>;
  readonly visible: boolean;
  readonly wrapperStyle: CSSProperties;
  readonly portalTarget: HTMLElement | null;
  readonly onMaskClick: () => void;
  readonly onCloseButtonClick: () => void;
}

export function useModalLifecycle(args: UseModalLifecycleArgs): UseModalLifecycleReturn {
  const ctx = useUIContext();
  const isControlled = args.show !== undefined;
  const [internalShow, setInternalShow] = useState(false);
  const visible = isControlled ? !!args.show : internalShow;

  const panelRef = useRef<HTMLDivElement>(null);
  const [popupZIndex, setPopupZIndex] = useState(1000);

  const argsRef = useRef(args);
  argsRef.current = args;

  const setVisible = useCallback(
    (next: boolean, reason: ModalCloseReason | null) => {
      const current = argsRef.current;
      if (current.disabled && next) return;
      if (!isControlled) setInternalShow(next);
      current.onVisibilityChange?.(next);
      if (!next && reason !== null) current.onClose?.(reason);
    },
    [isControlled],
  );

  // Body scroll lock + keydown listener while visible
  useEffect(() => {
    if (!visible) return;

    lockBodyScroll();
    setPopupZIndex(nextPopupZIndex());

    const onKeyDown = (event: KeyboardEvent) => {
      const current = argsRef.current;
      if (event.key === 'Escape' && current.escClosable) {
        setVisible(false, 'esc');
        return;
      }
      if (event.key !== 'Tab') return;
      const root = panelRef.current;
      if (root === null) return;
      if (!root.contains(document.activeElement)) return;
      const first = getFirstFocusable(root);
      const last = getLastFocusable(root);
      if (first === null || last === null) return;
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', onKeyDown);
    }

    return () => {
      unlockBodyScroll();
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', onKeyDown);
      }
    };
  }, [visible, setVisible]);

  // Focus first focusable on open
  useLayoutEffect(() => {
    if (!visible) return;
    const root = panelRef.current;
    if (root === null) return;
    const focusTarget = getFirstFocusable(root) ?? root;
    focusTarget.focus();
  }, [visible]);

  const onMaskClick = useCallback(() => {
    if (!argsRef.current.maskClosable) return;
    setVisible(false, 'mask');
  }, [setVisible]);

  const onCloseButtonClick = useCallback(() => {
    setVisible(false, 'close-button');
  }, [setVisible]);

  const wrapperStyle = useMemo<CSSProperties>(() => ({ zIndex: popupZIndex }), [popupZIndex]);

  const portalTarget = useMemo<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null;
    const pc = ctx.portalContainer;
    if (typeof pc === 'function') {
      return pc() ?? document.body;
    }
    if (typeof pc === 'string') {
      return document.querySelector(pc) ?? document.body;
    }
    return document.body;
  }, [ctx]);

  return {
    panelRef,
    visible,
    wrapperStyle,
    portalTarget,
    onMaskClick,
    onCloseButtonClick,
  };
}
