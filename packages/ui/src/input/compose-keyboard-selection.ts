/**
 * Compute the next selected key after a keyboard navigation event over
 * an ordered list of available keys. Pure helper used by Select /
 * Cascader / Dropdown / Menu / AutoComplete / Mention dropdowns for
 * arrow-key + Home/End navigation.
 *
 * Phase 7 (2026-06-02).
 *
 * Direction semantics:
 *
 * - `'down'` — move to the next key (index + 1). When no current key,
 *   selects the first available key.
 * - `'up'` — move to the previous key (index - 1). When no current key,
 *   selects the last available key.
 * - `'home'` — jump to the first key (regardless of current).
 * - `'end'` — jump to the last key (regardless of current).
 *
 * Wrap behavior (default `false`):
 *
 * - With `wrap: false`, navigation past either end clamps to the
 *   bound key (the first / last available).
 * - With `wrap: true`, navigation past the end wraps around to the
 *   other end (matches most dropdown UX conventions).
 *
 * Edge cases:
 *
 * - Empty `availableKeys` → returns `null` for any direction.
 * - `currentKey` not present in `availableKeys` (e.g. user-typed value
 *   that's not in the list) — treated as "no current key": `down` →
 *   first, `up` → last, `home`/`end` always work.
 *
 * Generic over key type `K` — strings, numbers, or any value type that
 * supports `===` equality (the helper uses `indexOf`).
 */
export type KeyboardSelectionDirection = 'up' | 'down' | 'home' | 'end';

export interface ComposeKeyboardSelectionInput<K> {
  /** The currently-selected key, or `null` if no selection. */
  readonly currentKey: K | null;
  /** Ordered list of selectable keys. Empty array → result is always `null`. */
  readonly availableKeys: readonly K[];
  /** Navigation direction (from the corresponding keyboard event). */
  readonly direction: KeyboardSelectionDirection;
  /** When `true`, `up`/`down` wraps around at the ends. Default `false`. */
  readonly wrap?: boolean;
}

export function composeKeyboardSelection<K>(input: ComposeKeyboardSelectionInput<K>): K | null {
  const { currentKey, availableKeys, direction, wrap = false } = input;
  if (availableKeys.length === 0) return null;
  const lastIndex = availableKeys.length - 1;

  switch (direction) {
    case 'home':
      return availableKeys[0] ?? null;
    case 'end':
      return availableKeys[lastIndex] ?? null;
    case 'down':
    case 'up': {
      const currentIndex = currentKey === null ? -1 : availableKeys.indexOf(currentKey);
      if (currentIndex < 0) {
        // No prior selection (or unknown key): bias toward the natural endpoint.
        return direction === 'down' ? availableKeys[0]! : availableKeys[lastIndex]!;
      }
      const step = direction === 'down' ? 1 : -1;
      let nextIndex = currentIndex + step;
      if (nextIndex < 0) {
        nextIndex = wrap ? lastIndex : 0;
      } else if (nextIndex > lastIndex) {
        nextIndex = wrap ? 0 : lastIndex;
      }
      return availableKeys[nextIndex] ?? null;
    }
  }
}
