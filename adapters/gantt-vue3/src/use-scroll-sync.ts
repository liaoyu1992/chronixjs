import { onMounted, onUnmounted, ref, type Ref } from 'vue';

/**
 * bidirectional vertical scroll sync between two DOM
 * elements. Reads each element's scroll event and writes the other's
 * `scrollTop` in lockstep, guarded by a source-tracking flag so the
 * writeback doesn't fire its own scroll event in an infinite loop.
 *
 * Algorithm:
 *
 *   1. On scroll of pane A: if no source is set OR source is 'a',
 *      claim source = 'a', write `b.scrollTop = a.scrollTop`, then
 *      requestAnimationFrame to reset source to null.
 *   2. The write in (1) fires a scroll event on B. B's handler sees
 *      source = 'a' (not 'b') and bails out — no writeback.
 *   3. Symmetric for scrolls originating on B.
 *
 * The rAF reset clears the source flag after the browser has
 * settled both panes' scroll positions, so the next user-initiated
 * scroll on either side can take over fresh. This matches the
 * original `scrollingPaneRef` idiom verbatim — proven
 * robust across mouse wheel, scrollbar drag, and programmatic
 * `element.scrollTo()`.
 *
 * Both refs may resolve to `null` before mount or in degenerate
 * cases (e.g. no-sidebar mode where one pane isn't rendered).
 * Null refs cause the composable to no-op silently — safe to call
 * unconditionally from setup.
 */
export function useScrollSync(
  paneA: Ref<HTMLElement | null>,
  paneB: Ref<HTMLElement | null>,
): void {
  const source = ref<'a' | 'b' | null>(null);

  function onScrollA(): void {
    const a = paneA.value;
    const b = paneB.value;
    if (!a || !b) return;
    if (source.value !== null && source.value !== 'a') return;
    source.value = 'a';
    b.scrollTop = a.scrollTop;
    requestAnimationFrame(() => {
      source.value = null;
    });
  }

  function onScrollB(): void {
    const a = paneA.value;
    const b = paneB.value;
    if (!a || !b) return;
    if (source.value !== null && source.value !== 'b') return;
    source.value = 'b';
    a.scrollTop = b.scrollTop;
    requestAnimationFrame(() => {
      source.value = null;
    });
  }

  // Captured element refs for cleanup. Vue nullifies template refs
  // BEFORE `onUnmounted` fires, so reading `paneA.value` in the
  // cleanup hook would always see `null` — the listener would leak.
  // Capture the resolved elements at mount time so removeEventListener
  // calls find the exact same node the addEventListener calls used.
  let capturedA: HTMLElement | null = null;
  let capturedB: HTMLElement | null = null;

  onMounted(() => {
    capturedA = paneA.value;
    capturedB = paneB.value;
    capturedA?.addEventListener('scroll', onScrollA, { passive: true });
    capturedB?.addEventListener('scroll', onScrollB, { passive: true });
  });

  onUnmounted(() => {
    capturedA?.removeEventListener('scroll', onScrollA);
    capturedB?.removeEventListener('scroll', onScrollB);
    capturedA = null;
    capturedB = null;
  });
}
