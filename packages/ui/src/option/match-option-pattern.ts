/**
 * Compute highlight char-range spans inside an option label. Phase 31
 * (2026-06-04). Pure helper used by Mention / Select v0.2 for inline
 * highlight rendering.
 *
 * Returns `[start, end]` pairs (half-open, end-exclusive) in
 * label-index space. Empty / whitespace query returns `[]`.
 *
 * Matches are case-insensitive but the returned spans index into the
 * original `label` (preserving its case). Non-overlapping; sorted by
 * start index.
 */
export type MatchSpan = readonly [start: number, end: number];

export function matchOptionPattern(label: string, query: string): readonly MatchSpan[] {
  if (label === '' || query === '') return [];
  const needle = query.toLowerCase();
  if (needle === '') return [];
  const hay = label.toLowerCase();
  const spans: MatchSpan[] = [];
  let from = 0;
  while (from <= hay.length - needle.length) {
    const idx = hay.indexOf(needle, from);
    if (idx < 0) break;
    spans.push([idx, idx + needle.length]);
    from = idx + needle.length;
  }
  return spans;
}
