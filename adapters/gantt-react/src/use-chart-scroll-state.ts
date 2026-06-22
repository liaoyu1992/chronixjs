import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

/**
 * Phase 32.5.2 FIX (2026-06-22):
 *
 * PROBLEM: Vue doesn't flicker because ref.value = x is synchronous update.
 * React setState is async (React 18 concurrent rendering), causing flicker.
 *
 * SOLUTION: Use flushSync to force synchronous rendering during scroll events.
 *
 * The core issue:
 * - Scroll event fires → setState schedules async re-render
 * - Before re-render commits, DOM continues scrolling
 * - Component renders with stale scroll values → flicker
 *
 * With flushSync:
 * - Scroll event fires → flushSync forces immediate re-render
 * - DOM updates synchronously → no time for DOM to drift
 * - Component renders with fresh scroll values → no flicker
 *
 * Also adds requestAnimationFrame throttling to avoid excessive re-renders
 * during rapid scroll events (browser fires many scroll events per second).
 */

export interface ChartScrollState {
  readonly scrollLeft: number;
  readonly clientWidth: number;
}

export function useChartScrollState(paneRef: RefObject<HTMLElement | null>): ChartScrollState {
  const stateRef = useRef<ChartScrollState>({ scrollLeft: 0, clientWidth: 0 });
  const paneElRef = useRef<HTMLElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;

    paneElRef.current = pane;

    const handleScroll = () => {
      // Cancel any pending RAF to avoid stacking updates
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // Read fresh DOM values
      stateRef.current = { scrollLeft: pane.scrollLeft, clientWidth: pane.clientWidth };

      // CRITICAL: Use flushSync to force synchronous rendering
      // This ensures the component re-renders immediately with the fresh values,
      // preventing the flicker caused by React's async batching.
      flushSync(() => {
        setTick((t) => t + 1);
      });
    };

    // Throttle with RAF to avoid excessive re-renders during rapid scroll
    const handleScrollThrottled = () => {
      if (rafIdRef.current !== null) {
        return; // Already scheduled
      }

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        handleScroll();
      });
    };

    // Setup listeners
    pane.addEventListener('scroll', handleScrollThrottled, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        // For resize, we don't need RAF throttling since it fires less frequently
        handleScroll();
      });
      resizeObserver.observe(pane);
    }

    // Initial read (no flushSync needed - useEffect runs after paint)
    stateRef.current = { scrollLeft: pane.scrollLeft, clientWidth: pane.clientWidth };
    setTick(0);

    return () => {
      pane.removeEventListener('scroll', handleScrollThrottled);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      resizeObserver?.disconnect();
      paneElRef.current = null;
    };
  }, [paneRef]);

  // Fallback: ensure we have the latest values before paint
  // This is a safety net in case something bypassed the scroll handler
  useLayoutEffect(() => {
    const pane = paneElRef.current;
    if (pane) {
      const freshState = { scrollLeft: pane.scrollLeft, clientWidth: pane.clientWidth };
      // Only update if values changed to avoid re-renders
      if (
        freshState.scrollLeft !== stateRef.current.scrollLeft ||
        freshState.clientWidth !== stateRef.current.clientWidth
      ) {
        stateRef.current = freshState;
      }
    }
  });

  return stateRef.current;
}
