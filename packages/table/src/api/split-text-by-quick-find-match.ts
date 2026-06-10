/**
 * Phase 41.1 (2026-05-29): one segment in a cell text after splitting
 * by a quick-find needle. `isMatch === true` means the segment
 * matched the lowercased needle (case-insensitive substring); the
 * SFC wraps it in a `<span class="cx-table-cell__find-match">`.
 * `isMatch === false` segments render as plain text.
 *
 * Segments preserve the ORIGINAL casing of the input text — the
 * needle is lowercased only for comparison, not for output.
 */
export interface TextSegment {
  readonly text: string;
  readonly isMatch: boolean;
}

/**
 * Phase 41.1 (2026-05-29): split a cell text by a quick-find needle
 * into alternating match / non-match segments.
 *
 * Behavior:
 *
 * - Empty / blank needle (`needle === ''` after `.trim()`) → returns
 *   a single non-match segment carrying the full text (no highlight).
 *   Mirrors Phase 41's identity case for empty needles.
 * - Empty text → returns an empty array.
 * - Non-empty text + non-empty needle → walks `text` lowercased,
 *   finding each occurrence of the lowercased needle. Pushes a
 *   non-match segment for the gap before each match (when non-empty),
 *   then a match segment carrying the original-case slice of `text`
 *   at the match position. Finally pushes a non-match segment for
 *   the trailing gap (when non-empty).
 * - Back-to-back matches don't emit an empty non-match segment between
 *   them (the caller can rely on every emitted segment having
 *   non-empty text).
 *
 * **Pure function.** No mutation of inputs.
 */
export function splitTextByQuickFindMatch(text: string, needle: string): readonly TextSegment[] {
  if (text === '') return [];

  const trimmed = needle.trim();
  if (trimmed === '') {
    return [{ text, isMatch: false }];
  }

  const lowerText = text.toLowerCase();
  const lowerNeedle = trimmed.toLowerCase();
  const needleLen = lowerNeedle.length;

  const segments: TextSegment[] = [];
  let cursor = 0;
  let nextMatch = lowerText.indexOf(lowerNeedle, cursor);
  while (nextMatch >= 0) {
    if (nextMatch > cursor) {
      segments.push({ text: text.slice(cursor, nextMatch), isMatch: false });
    }
    segments.push({ text: text.slice(nextMatch, nextMatch + needleLen), isMatch: true });
    cursor = nextMatch + needleLen;
    nextMatch = lowerText.indexOf(lowerNeedle, cursor);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }

  // When `text` doesn't contain the needle at all, no match segment
  // was emitted; return a single non-match segment carrying the full
  // text so the caller can short-circuit to plain-text render.
  if (segments.length === 0) {
    segments.push({ text, isMatch: false });
  }

  return segments;
}
