import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

/**
 * Phase 23: tracks the chart-pane's `scrollLeft` + `clientWidth` so
 * downstream render code can react to user scroll and container
 * resize. Returned values are reactive values that update on scroll.
 *
 * Designed as a consumer-facing hook for follow-up phases that need
 * the chart-pane viewport state:
 *
 *   - **Phase 27.1** — `PlacedBar.isClippedStart` / `isClippedEnd`
 *     viewport-clipping flags (vs Phase 27's axis-range flags) need
 *     scrollLeft + clientWidth to decide whether a bar's start/end
 *     extends past the visible viewport.
 *   - **Phase 28.2.1** — bar title truncation can shrink the
 *     available text width to the visible viewport intersection,
 *     not the full bar width, when the bar extends past either
 *     viewport edge.
 *
 * Listens on the pane's `scroll` event for scrollLeft updates +
 * uses `ResizeObserver` for clientWidth updates (so container
 * resizes also trigger reads). Both default to `0` before mount or
 * when the ref doesn't resolve; consumers can guard on
 * `clientWidth > 0` to skip the first-paint pre-mount frame.
 *
 * Uses flushSync to force synchronous rendering during scroll events,
 * preventing the flicker caused by React's async batching. Mirrors
 * the Vue3 implementation's synchronous ref updates.
 */

export interface ChartScrollState {
  readonly scrollLeft: number;
  readonly clientWidth: number;
}

export function useChartScrollState(paneRef: RefObject<HTMLElement | null>): ChartScrollState {
  const stateRef = useRef<ChartScrollState>({ scrollLeft: 0, clientWidth: 0 });
  const paneElRef = useRef<HTMLElement | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;

    paneElRef.current = pane;

    const handleScroll = () => {
      // Read fresh DOM values
      stateRef.current = { scrollLeft: pane.scrollLeft, clientWidth: pane.clientWidth };

      // CRITICAL: Use flushSync to force synchronous rendering
      // This ensures the component re-renders immediately with the fresh values,
      // preventing the flicker caused by React's async batching.
      flushSync(() => {
        setTick((t) => t + 1);
      });
    };

    // Setup listeners
    pane.addEventListener('scroll', handleScroll, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleScroll);
      resizeObserver.observe(pane);
    }

    // Initial read (no flushSync needed - useEffect runs after paint)
    stateRef.current = { scrollLeft: pane.scrollLeft, clientWidth: pane.clientWidth };
    setTick(0);

    return () => {
      pane.removeEventListener('scroll', handleScroll);
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
