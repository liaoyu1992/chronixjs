/**
 * Phase 28.2 / Phase 32.6: char-count + ellipsis truncation for bar
 * titles. Pure function — no DOM, no framework reactivity. Returns
 * the unmodified string when it already fits; an empty string when
 * even four characters cannot fit (cutoff at `maxChars <= 3`);
 * otherwise the prefix + `...` ellipsis.
 *
 * `avgCharWidth = fontSize * 0.6` is the empirical approximation
 * the original spec uses across all bar-text rendering paths.
 * It is intentionally width-agnostic of the rendered font family —
 * downstream consumers picking exotic fonts may see slightly tighter
 * or looser fit; the formula matches the original behavior
 * deliberately to keep cross-renderer truncation output byte-identical.
 *
 * Ported verbatim from the original spec's
 * `TimelineEvent.tsx truncateText` lines 715-730. The 3-character
 * Latin ellipsis `'...'` is deliberate — it occupies more visual
 * width than the single-glyph Unicode `'…'` and matches the
 * reference's appearance.
 *
 * Phase 32.6 relocation note: prior to Phase 32.6, each chronix
 * adapter shipped its own inline copy of this helper. Phase 32.4's
 * chronix-react port introduced a silent drift (cutoff = 1 +
 * single-glyph `'…'` ellipsis); Phase 32.6 reconciled react to the
 * canonical variant here. All 3 adapters now consume this canonical
 * implementation directly.
 */
export function truncateBarText(text: string, maxWidth: number, fontSize: number): string {
  const avgCharWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / avgCharWidth);
  if (text.length <= maxChars) return text;
  if (maxChars <= 3) return '';
  return text.slice(0, maxChars - 3) + '...';
}
