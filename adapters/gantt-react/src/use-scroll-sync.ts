import { useEffect, useRef, type RefObject } from 'react';

/**
 * Phase 48 — bidirectional vertical scroll sync between two DOM
 * elements (React port of `adapters/gantt-vue3/src/use-scroll-sync.ts`).
 * Reads each element's scroll event and writes the other's
 * `scrollTop` in lockstep, guarded by a source-tracking ref so the
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
 * Source tracking lives in a `useRef` (not `useState`) so writes
 * don't trigger React re-renders — scroll-sync is a side-effect-only
 * coordination, not part of the render tree.
 *
 * Both refs may resolve to `null` before mount or in degenerate
 * cases (e.g. no-sidebar mode where one pane isn't rendered).
 * Null refs cause the hook to no-op silently — safe to call
 * unconditionally from the component body.
 */
export function useScrollSync(
  paneA: RefObject<HTMLElement | null>,
  paneB: RefObject<HTMLElement | null>,
): void {
  const sourceRef = useRef<'a' | 'b' | null>(null);

  useEffect(() => {
    const a = paneA.current;
    const b = paneB.current;
    if (!a || !b) return;

    function onScrollA(): void {
      if (!a || !b) return;
      if (sourceRef.current !== null && sourceRef.current !== 'a') return;
      sourceRef.current = 'a';
      b.scrollTop = a.scrollTop;
      requestAnimationFrame(() => {
        sourceRef.current = null;
      });
    }

    function onScrollB(): void {
      if (!a || !b) return;
      if (sourceRef.current !== null && sourceRef.current !== 'b') return;
      sourceRef.current = 'b';
      a.scrollTop = b.scrollTop;
      requestAnimationFrame(() => {
        sourceRef.current = null;
      });
    }

    a.addEventListener('scroll', onScrollA, { passive: true });
    b.addEventListener('scroll', onScrollB, { passive: true });

    return () => {
      a.removeEventListener('scroll', onScrollA);
      b.removeEventListener('scroll', onScrollB);
    };
  }, [paneA, paneB]);
}
