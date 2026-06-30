import { useEffect, useState, type RefObject } from 'react';

/**
 * React hook that tracks the body scrollport
 * element's `clientHeight` + `scrollTop` so the virtual-rows pass can
 * pick the visible row window when the body's content height exceeds
 * its viewport. Returned values are plain `number`s (NOT Vue-style
 * refs) — React's state model triggers a component re-render whenever
 * either value changes.
 *
 * Vertical-axis sibling of `useTableContainerSize`: that hook tracks
 * horizontal `clientWidth` on the wrapper for column flex distribution;
 * `useTableBodyScroll` tracks `clientHeight` + `scrollTop` on the
 * body scrollport for row virtualization.
 *
 * Listens via `ResizeObserver` for size updates + a `scroll` listener
 * (passive) for scrollTop updates. Seeds both values synchronously
 * inside `useEffect` via `getBoundingClientRect` so the first paint
 * resolves at the real height rather than `0`. Defaults are `0`
 * before mount; consumers can guard on `clientHeight > 0` to skip
 * the pre-mount first frame (`virtualRowsPass` returns the empty
 * result for `viewportHeight <= 0` so the guard is structural, not
 * consumer-driven).
 *
 * Mirrors the chronix-table-vue3 `useTableBodyScroll` composable +
 * the chronix-react `useChartScrollState` hook
 * (`adapters/gantt-react/src/use-chart-scroll-state.ts`) — same captured-
 * ref-for-cleanup discipline because React may have nullified the
 * RefObject by the time the effect cleanup runs.
 *
 * Decision C.1 (carried) — `typeof ResizeObserver
 * !== 'undefined'` gate covers both jsdom (test env, no
 * ResizeObserver) AND SSR with one mechanism. In jsdom the observer
 * simply never fires; tests can fire scroll events directly +
 * override `clientHeight` via `Object.defineProperty` for assertions.
 */
export interface TableBodyScroll {
  readonly clientHeight: number;
  readonly scrollTop: number;
}

export function useTableBodyScroll(elementRef: RefObject<HTMLElement | null>): TableBodyScroll {
  const [clientHeight, setClientHeight] = useState<number>(0);
  const [scrollTop, setScrollTop] = useState<number>(0);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    function readState(): void {
      // el is captured in closure — safe to read .clientHeight /
      // .scrollTop without re-checking elementRef.current (which
      // React may have nullified by the time cleanup fires).
      if (!el) return;
      const nextHeight = el.clientHeight;
      const nextScrollTop = el.scrollTop;
      setClientHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      setScrollTop((prev) => (prev === nextScrollTop ? prev : nextScrollTop));
    }

    // Seed via synchronous read so the first paint already has the
    // real values — `ResizeObserver`'s initial callback otherwise
    // fires after the next animation frame.
    setClientHeight((prev) => (prev === el.clientHeight ? prev : el.clientHeight));
    setScrollTop((prev) => (prev === el.scrollTop ? prev : el.scrollTop));

    el.addEventListener('scroll', readState, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(readState);
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener('scroll', readState);
      resizeObserver?.disconnect();
    };
  }, [elementRef]);

  return { clientHeight, scrollTop };
}
