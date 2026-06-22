import { useEffect, useState, useRef, useLayoutEffect, type RefObject } from 'react';

/**
 * Phase 32.5 (Phase 23 in chronix-vue3 / Phase 31.5.2 in chronix-vue2):
 * tracks the chart-pane's `scrollLeft` + `clientWidth` so downstream
 * render code can react to user scroll and container resize. Returned
 * values are plain numbers that trigger re-renders when they change.
 *
 * IMPORTANT: Returns real-time current scroll values on each render,
 * not just cached state. This ensures viewport clipping calculations
 * always use the latest scroll position, even during drag operations
 * where scroll events may not have fired recently.
 *
 * Designed as a consumer-facing hook for follow-up phases that need
 * the chart-pane viewport state:
 *
 *   - **Phase 32.5.1** — viewport-clipping math for triangles,
 *     bar text positioning, and dot positioning; reads scrollLeft +
 *     clientWidth to decide whether a bar's start/end extends past
 *     the visible viewport.
 *
 * Listens on the pane's `scroll` event for scrollLeft updates +
 * uses `ResizeObserver` for clientWidth updates (so container
 * resizes also trigger reads). Both default to `0` before mount or
 * when the ref doesn't resolve; consumers can guard on
 * `clientWidth > 0` to skip the first-paint pre-mount frame.
 *
 * Decision A.1 — plain `useState` with shallow-equal short-circuit
 * is the right tool here: scroll state isn't read-mutate-in-same-
 * handler so Phase 32.2's `useRef + useReducer + getter` machinery
 * is unnecessary overhead. Standard React re-render flow on state
 * change.
 *
 * Decision C.1 — `typeof ResizeObserver !== 'undefined'` gate covers
 * both jsdom (test env, no ResizeObserver) AND SSR with one
 * mechanism. In jsdom the observer simply never fires; tests use
 * direct `fireEvent.scroll` to dispatch scroll events for assertions.
 */
export interface ChartScrollState {
  readonly scrollLeft: number;
  readonly clientWidth: number;
}

export function useChartScrollState(paneRef: RefObject<HTMLElement | null>): ChartScrollState {
  const [state, setState] = useState<ChartScrollState>({ scrollLeft: 0, clientWidth: 0 });
  // Use a ref to track the current DOM values - this is always in sync
  const currentRef = useRef<ChartScrollState>({ scrollLeft: 0, clientWidth: 0 });

  useEffect(() => {
    const pane = paneRef.current;
    if (!pane) return;

    function readState(): void {
      // pane is captured in closure — safe to read .scrollLeft / .clientWidth
      // without re-checking paneRef.current (which React may have nullified
      // by the time cleanup fires).
      if (!pane) return;
      const next = { scrollLeft: pane.scrollLeft, clientWidth: pane.clientWidth };
      currentRef.current = next;
      setState((prev) =>
        prev.scrollLeft === next.scrollLeft && prev.clientWidth === next.clientWidth ? prev : next,
      );
    }

    pane.addEventListener('scroll', readState, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(readState);
      resizeObserver.observe(pane);
    }

    // Initial read so pre-scroll consumers see the mounted clientWidth
    // immediately (matches vue2's `readState()` call at end of onMounted).
    readState();

    return () => {
      pane.removeEventListener('scroll', readState);
      resizeObserver?.disconnect();
    };
  }, [paneRef]);

  // useLayoutEffect runs after DOM mutations but before browser paint.
  // This updates currentRef with latest DOM values before render completes.
  useLayoutEffect(() => {
    const pane = paneRef.current;
    if (pane) {
      const current = { scrollLeft: pane.scrollLeft, clientWidth: pane.clientWidth };
      currentRef.current = current;
    }
  });

  // Return currentRef values for real-time access during render.
  // This ensures viewport clipping always uses the latest scroll position.
  return currentRef.current;
}
