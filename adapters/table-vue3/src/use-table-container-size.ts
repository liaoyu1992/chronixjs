import { onMounted, onUnmounted, ref, type Ref } from 'vue';

/**
 * tracks the table wrapper element's `clientWidth` so the
 * column-layout pass can re-distribute flex weights when the parent
 * container resizes. Returned value is a Vue ref that updates
 * reactively.
 *
 * Designed as a primitive that downstream phases can reuse:
 *
 *   - **+** — pinned columns split into left / center / right
 *     scroll zones; each zone observes its own element via a separate
 *     `useTableContainerSize` instance.
 *   - **** — `virtualRowsPass` needs the body element's
 *     `clientHeight` for the visible-row window; a sibling
 *     `useTableContainerHeight` (or extended shape) lands then.
 *
 * Listens via `ResizeObserver` for size updates + seeds the initial
 * value synchronously in `onMounted` via `getBoundingClientRect` so
 * the first paint resolves at the real width rather than `0`.
 * Default value is `0` before mount; consumers can guard on
 * `clientWidth > 0` to skip a pre-mount first frame.
 *
 * Mirrors the chronix-gantt's `useChartScrollState` pattern
 * (`adapters/gantt-vue3/src/use-chart-scroll-state.ts`) — same captured-
 * ref-for-cleanup discipline because Vue nullifies template refs
 * before `onUnmounted` fires.
 */
export interface TableContainerSize {
  readonly clientWidth: Ref<number>;
}

export function useTableContainerSize(elementRef: Ref<HTMLElement | null>): TableContainerSize {
  const clientWidth = ref(0);

  function readSize(): void {
    const el = elementRef.value;
    if (!el) return;
    clientWidth.value = el.clientWidth;
  }

  let resizeObserver: ResizeObserver | null = null;
  // Captured element reference for cleanup — Vue nullifies template
  // refs before `onUnmounted` fires, so reading `elementRef.value` in
  // cleanup would always see `null`.
  let capturedEl: HTMLElement | null = null;

  onMounted(() => {
    capturedEl = elementRef.value;
    if (capturedEl) {
      // Seed via synchronous `getBoundingClientRect` so the first
      // paint already has the real width — `ResizeObserver`'s initial
      // callback otherwise fires after the next animation frame.
      clientWidth.value = capturedEl.getBoundingClientRect().width;
    }
    if (typeof ResizeObserver !== 'undefined' && capturedEl) {
      resizeObserver = new ResizeObserver(readSize);
      resizeObserver.observe(capturedEl);
    }
  });

  onUnmounted(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    capturedEl = null;
  });

  return { clientWidth };
}
