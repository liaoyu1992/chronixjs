/**
 * Highlight IR — . Tier A text with substring
 * matching wrapped in <mark>. No regex (deferred to v0.2).
 */

export interface HighlightProps {
  readonly value: string;
  /** Substring to highlight. Empty string emits no <mark>. */
  readonly pattern: string;
  readonly caseSensitive: boolean;
}

export const defaultHighlightProps: HighlightProps = {
  value: '',
  pattern: '',
  caseSensitive: false,
};

/** A single rendered segment within a HighlightProps value. */
export interface HighlightSegment {
  readonly text: string;
  readonly matched: boolean;
}

/**
 * Split `value` into alternating matched / unmatched segments based
 * on `pattern`. When `pattern === ''` returns a single unmatched
 * segment containing the whole value.
 */
export function splitHighlightSegments(props: HighlightProps): readonly HighlightSegment[] {
  const { value, pattern, caseSensitive } = props;
  if (pattern.length === 0) {
    return value.length > 0 ? [{ text: value, matched: false }] : [];
  }

  const segments: HighlightSegment[] = [];
  const needle = caseSensitive ? pattern : pattern.toLowerCase();
  const haystack = caseSensitive ? value : value.toLowerCase();
  let cursor = 0;

  while (cursor < value.length) {
    const idx = haystack.indexOf(needle, cursor);
    if (idx === -1) {
      segments.push({ text: value.slice(cursor), matched: false });
      break;
    }
    if (idx > cursor) {
      segments.push({ text: value.slice(cursor, idx), matched: false });
    }
    segments.push({ text: value.slice(idx, idx + pattern.length), matched: true });
    cursor = idx + pattern.length;
  }

  return segments;
}
