import { onMounted, onUnmounted, ref, type Ref } from 'vue';

/**
 * tracks the table wrapper element's
 * `clientWidth` so the column-layout pass can re-distribute flex
 * weights when the parent container resizes. Returned value is a
 * Vue ref that updates reactively.
 *
 * Verbatim port of chronix-table-vue3's `use-table-container-size.ts`
 * (form) — Vue 2.7's `onMounted` / `onUnmounted` / `ref` /
 * `Ref` are identical to Vue 3's so no compat shim is needed.
 *
 * Designed as a primitive that downstream phases can reuse:
 *
 *   - **(port of vue3)** — `virtualRowsPass` will
 *     need the body element's `clientHeight` for the visible-row
 *     window; a sibling `useTableContainerHeight` (or extended
 *     shape) lands then.
 *   - **+ (vue3 +)** — pinned columns split into
 *     left / center / right scroll zones; each zone observes its
 *     own element via a separate `useTableContainerSize` instance.
 *
 * Listens via `ResizeObserver` for size updates + seeds the initial
 * value synchronously in `onMounted` via `getBoundingClientRect` so
 * the first paint resolves at the real width rather than `0`.
 * Default value is `0` before mount; consumers can guard on
 * `clientWidth > 0` to skip a pre-mount first frame.
 *
 * Captured-element-for-cleanup discipline because Vue nullifies
 * template refs before `onUnmounted` fires — reading
 * `elementRef.value` in cleanup would always see `null`.
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
  let capturedEl: HTMLElement | null = null;

  onMounted(() => {
    capturedEl = elementRef.value;
    if (capturedEl) {
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
