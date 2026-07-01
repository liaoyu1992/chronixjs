import {
  DEFAULT_HOVER_ENTER_DELAY_MS,
  DEFAULT_HOVER_LEAVE_DELAY_MS,
  defaultPopupSpec,
  nextPopupZIndex,
  resolvePopupPlacement,
  type PopupPlacement,
  type PopupSpec,
  type PopupTrigger,
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
 * React popup lifecycle hook. . Same concerns as
 * the Vue 3 composable: controlled+uncontrolled `show`, anchor+popup
 * measurement, z-index, trigger lifecycle (click / hover / focus /
 * manual), click-outside + Escape, scroll/resize re-measurement,
 * portal target resolution.
 */

export interface UsePopupLifecycleArgs {
  readonly show: boolean | undefined;
  readonly trigger: PopupTrigger;
  readonly placement: PopupPlacement;
  readonly offset: number;
  readonly flip: boolean;
  readonly widthMatch: boolean;
  readonly disabled: boolean;
  readonly onVisibilityChange: ((next: boolean) => void) | undefined;
}

export interface UsePopupLifecycleReturn {
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly popupRef: RefObject<HTMLDivElement | null>;
  readonly visible: boolean;
  readonly actualPlacement: PopupPlacement;
  readonly popupStyle: CSSProperties;
  readonly portalTarget: HTMLElement | null;
  readonly triggerHandlers: TriggerHandlers;
  readonly popupHandlers: PopupHandlers;
}

interface TriggerHandlers {
  readonly onClick: () => void;
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

interface PopupHandlers {
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
}

export function usePopupLifecycle(args: UsePopupLifecycleArgs): UsePopupLifecycleReturn {
  const ctx = useUIContext();

  const isControlled = args.show !== undefined;
  const [internalShow, setInternalShow] = useState(false);
  const visible = isControlled ? !!args.show : internalShow;

  const triggerRef = useRef<HTMLElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupLeft, setPopupLeft] = useState(0);
  const [popupTop, setPopupTop] = useState(0);
  const [popupZIndex, setPopupZIndex] = useState(1000);
  const [actualPlacement, setActualPlacement] = useState<PopupPlacement>(args.placement);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const argsRef = useRef(args);
  argsRef.current = args;

  const setVisible = useCallback(
    (next: boolean) => {
      const current = argsRef.current;
      if (current.disabled && next) return;
      if (!isControlled) setInternalShow(next);
      current.onVisibilityChange?.(next);
    },
    [isControlled],
  );

  const measure = useCallback(() => {
    if (!triggerRef.current || !popupRef.current) return;
    if (typeof window === 'undefined') return;
    const current = argsRef.current;
    const anchorRect = triggerRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const viewportRect = {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
    const spec: PopupSpec = {
      placement: current.placement,
      offsetPx: current.offset,
      flip: current.flip,
      widthMatch: current.widthMatch,
      viewportPaddingPx: defaultPopupSpec.viewportPaddingPx,
    };
    const result = resolvePopupPlacement({
      anchorRect,
      popupRect,
      viewportRect,
      spec,
    });
    setPopupLeft(result.leftPx);
    setPopupTop(result.topPx);
    setActualPlacement(result.actualPlacement);
  }, []);

  // Click outside + Escape listeners while open
  useEffect(() => {
    if (!visible) return;

    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      setVisible(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setVisible(false);
    };

    setPopupZIndex(nextPopupZIndex());

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', measure, {
        passive: true,
        capture: true,
      });
      window.addEventListener('resize', measure);
    }
    if (typeof document !== 'undefined') {
      const trig = argsRef.current.trigger;
      if (trig === 'click' || trig === 'focus') {
        document.addEventListener('keydown', onEscape);
      }
      if (trig === 'click') {
        document.addEventListener('mousedown', onClickOutside);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', measure, true);
        window.removeEventListener('resize', measure);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', onEscape);
        document.removeEventListener('mousedown', onClickOutside);
      }
    };
  }, [visible, measure, setVisible]);

  // Re-measure once the popup is mounted after each open transition
  useLayoutEffect(() => {
    if (visible) measure();
  }, [visible, measure]);

  // Unmount cleanup for hover timer
  useEffect(
    () => () => {
      clearHoverTimer();
    },
    [clearHoverTimer],
  );

  const triggerHandlers = useMemo<TriggerHandlers>(
    () => ({
      onClick: () => {
        if (argsRef.current.trigger === 'click') setVisible(!visible);
      },
      onMouseEnter: () => {
        if (argsRef.current.trigger === 'hover') {
          clearHoverTimer();
          hoverTimerRef.current = setTimeout(() => setVisible(true), DEFAULT_HOVER_ENTER_DELAY_MS);
        }
      },
      onMouseLeave: () => {
        if (argsRef.current.trigger === 'hover') {
          clearHoverTimer();
          hoverTimerRef.current = setTimeout(() => setVisible(false), DEFAULT_HOVER_LEAVE_DELAY_MS);
        }
      },
      onFocus: () => {
        if (argsRef.current.trigger === 'focus') setVisible(true);
      },
      onBlur: () => {
        if (argsRef.current.trigger === 'focus') setVisible(false);
      },
    }),
    [visible, setVisible, clearHoverTimer],
  );

  const popupHandlers = useMemo<PopupHandlers>(
    () => ({
      onMouseEnter: () => {
        if (argsRef.current.trigger === 'hover') clearHoverTimer();
      },
      onMouseLeave: () => {
        if (argsRef.current.trigger === 'hover') {
          clearHoverTimer();
          hoverTimerRef.current = setTimeout(() => setVisible(false), DEFAULT_HOVER_LEAVE_DELAY_MS);
        }
      },
    }),
    [setVisible, clearHoverTimer],
  );

  const popupStyle: CSSProperties = useMemo(
    () => ({
      position: 'fixed',
      left: `${popupLeft}px`,
      top: `${popupTop}px`,
      zIndex: popupZIndex,
    }),
    [popupLeft, popupTop, popupZIndex],
  );

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
    triggerRef,
    popupRef,
    visible,
    actualPlacement,
    popupStyle,
    portalTarget,
    triggerHandlers,
    popupHandlers,
  };
}
