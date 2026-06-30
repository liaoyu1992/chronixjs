import { onMounted, onUnmounted, ref, type Ref } from 'vue';

/**
 * tracks the body scrollport element's `clientHeight` +
 * `scrollTop` so the virtual-rows pass can pick the visible row
 * window when the body's content height exceeds its viewport.
 *
 * Designed as the vertical-axis sibling of
 * `useTableContainerSize` — that composable tracks horizontal
 * `clientWidth` on the wrapper element for column flex
 * distribution; `useTableBodyScroll` tracks `clientHeight` +
 * `scrollTop` on the body scrollport element for row
 * virtualization.
 *
 * Mirrors chronix-gantt's `adapters/gantt-vue3/src/use-chart-scroll-state.ts`
 * pattern verbatim (same captured-ref-for-cleanup discipline; Vue
 * nullifies template refs before `onUnmounted` fires) — the gantt
 * has run this pattern through 33 phases with zero production bugs.
 *
 * Both refs default to `0` before mount; consumers can guard on
 * `clientHeight > 0` to skip the first-paint pre-mount frame
 * (`virtualRowsPass` returns the empty result for `viewportHeight
 * <= 0` so the guard is structural, not consumer-driven).
 */
export interface TableBodyScroll {
  readonly clientHeight: Ref<number>;
  readonly scrollTop: Ref<number>;
}

export function useTableBodyScroll(elementRef: Ref<HTMLElement | null>): TableBodyScroll {
  const clientHeight = ref(0);
  const scrollTop = ref(0);

  function readState(): void {
    const el = elementRef.value;
    if (!el) return;
    clientHeight.value = el.clientHeight;
    scrollTop.value = el.scrollTop;
  }

  let resizeObserver: ResizeObserver | null = null;
  // Captured element reference for cleanup — Vue nullifies template
  // refs before `onUnmounted` fires, so reading `elementRef.value` in
  // cleanup would always see `null`.
  let capturedEl: HTMLElement | null = null;

  onMounted(() => {
    capturedEl = elementRef.value;
    if (capturedEl) {
      // Seed via synchronous read so the first paint already has the
      // real values — ResizeObserver's initial callback otherwise
      // fires after the next animation frame.
      clientHeight.value = capturedEl.clientHeight;
      scrollTop.value = capturedEl.scrollTop;
      capturedEl.addEventListener('scroll', readState, { passive: true });
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(readState);
        resizeObserver.observe(capturedEl);
      }
    }
  });

  onUnmounted(() => {
    capturedEl?.removeEventListener('scroll', readState);
    resizeObserver?.disconnect();
    resizeObserver = null;
    capturedEl = null;
  });

  return { clientHeight, scrollTop };
}
