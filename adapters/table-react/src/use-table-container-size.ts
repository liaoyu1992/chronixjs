import { useEffect, useState, type RefObject } from 'react';

/**
 * React hook that tracks the table wrapper
 * element's `clientWidth` so the column-layout pass can re-distribute
 * flex weights when the parent container resizes. Returned value is
 * a plain `number` (NOT a Vue-style ref) — React's state model
 * triggers a component re-render whenever the value changes.
 *
 * Designed as a primitive that downstream phases can reuse:
 *
 *   - **(Sprint 5)** — `virtualRowsPass` needs the body
 *     element's `clientHeight` for the visible-row window; a sibling
 *     `useTableBodyScroll` hook will land then.
 *   - **-54** — selection / pagination / edit / resize all
 *     consume the resolved widths derived downstream from this hook.
 *
 * Listens via `ResizeObserver` for size updates + seeds the initial
 * value synchronously inside `useEffect` via `getBoundingClientRect`
 * so the first paint resolves at the real width rather than `0`.
 * Default value is `0` before mount; consumers can guard on
 * `clientWidth > 0` to skip a pre-mount first frame.
 *
 * Mirrors the chronix-table-vue3 `useTableContainerSize` composable
 * + the chronix-react `useChartScrollState` hook
 * (`adapters/gantt-react/src/use-chart-scroll-state.ts`) — same captured-
 * ref-for-cleanup discipline because React may have nullified the
 * RefObject by the time the effect cleanup runs.
 *
 * Decision C.1 (carried from gantt-react) — `typeof ResizeObserver
 * !== 'undefined'` gate covers both jsdom (test env, no
 * ResizeObserver) AND SSR with one mechanism. In jsdom the observer
 * simply never fires; tests can fire `Object.defineProperty(el,
 * 'clientWidth', ...)` + dispatch synthetic events for assertions.
 */
export interface TableContainerSize {
  readonly clientWidth: number;
}

export function useTableContainerSize(
  elementRef: RefObject<HTMLElement | null>,
): TableContainerSize {
  const [clientWidth, setClientWidth] = useState<number>(0);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    function readSize(): void {
      // el is captured in closure — safe to read .clientWidth without
      // re-checking elementRef.current (which React may have nullified
      // by the time cleanup fires).
      if (!el) return;
      const next = el.clientWidth;
      setClientWidth((prev) => (prev === next ? prev : next));
    }

    // Seed via synchronous `getBoundingClientRect` so the first paint
    // already has the real width — `ResizeObserver`'s initial callback
    // otherwise fires after the next animation frame.
    const seed = el.getBoundingClientRect().width;
    setClientWidth((prev) => (prev === seed ? prev : seed));

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(readSize);
      resizeObserver.observe(el);
    }

    return () => {
      resizeObserver?.disconnect();
    };
  }, [elementRef]);

  return { clientWidth };
}
