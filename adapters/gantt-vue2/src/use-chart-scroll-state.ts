import { onMounted, onUnmounted, ref, type Ref } from 'vue';

/**
 * Phase 31.5.2 (Phase 23 in chronix-vue3): tracks the chart-pane's
 * `scrollLeft` + `clientWidth` so downstream render code can react to
 * user scroll and container resize. Returned values are Vue refs that
 * update reactively.
 *
 * Designed as a consumer-facing hook for follow-up phases that need
 * the chart-pane viewport state:
 *
 *   - **Phase 27.1 (port deferred)** — `PlacedBar.isClippedStart` /
 *     `isClippedEnd` viewport-clipping flags (vs Phase 27's axis-range
 *     flags) need scrollLeft + clientWidth to decide whether a bar's
 *     start/end extends past the visible viewport. chronix-vue2
 *     currently emits `data-viewport-clipped="false"` placeholder
 *     pending this port.
 *   - **Phase 28.2.1 / 28.2.2 (port deferred)** — bar title truncation
 *     can shrink the available text width to the visible viewport
 *     intersection, not the full bar width, when the bar extends past
 *     either viewport edge.
 *
 * Listens on the pane's `scroll` event for scrollLeft updates +
 * uses `ResizeObserver` for clientWidth updates (so container
 * resizes also trigger reads). Both default to `0` before mount or
 * when the ref doesn't resolve; consumers can guard on
 * `clientWidth > 0` to skip the first-paint pre-mount frame.
 *
 * Verbatim port of chronix-vue3's `use-chart-scroll-state.ts` — Vue 2.7's
 * `onMounted` / `onUnmounted` / `ref` / `Ref` are identical to Vue 3's
 * so no compat shim is needed.
 */
export interface ChartScrollState {
  readonly scrollLeft: Ref<number>;
  readonly clientWidth: Ref<number>;
}

export function useChartScrollState(paneRef: Ref<HTMLElement | null>): ChartScrollState {
  const scrollLeft = ref(0);
  const clientWidth = ref(0);

  function readState(): void {
    const pane = paneRef.value;
    if (!pane) return;
    scrollLeft.value = pane.scrollLeft;
    clientWidth.value = pane.clientWidth;
  }

  let resizeObserver: ResizeObserver | null = null;
  // Captured element reference for cleanup — Vue (both 2.7 and 3)
  // nullifies template refs before `onUnmounted` fires, so reading
  // `paneRef.value` in cleanup would always see `null`. Capturing the
  // resolved element at mount time + cleaning up via the captured
  // reference is the same pattern used across chronix-vue3's Phase 23
  // composables (use-scroll-sync, useHeaderHorizontalSync inline).
  let capturedPane: HTMLElement | null = null;

  onMounted(() => {
    capturedPane = paneRef.value;
    capturedPane?.addEventListener('scroll', readState, { passive: true });
    if (typeof ResizeObserver !== 'undefined' && capturedPane) {
      resizeObserver = new ResizeObserver(readState);
      resizeObserver.observe(capturedPane);
    }
    readState();
  });

  onUnmounted(() => {
    capturedPane?.removeEventListener('scroll', readState);
    resizeObserver?.disconnect();
    resizeObserver = null;
    capturedPane = null;
  });

  return { scrollLeft, clientWidth };
}
