/**
 * Mention component IR — Phase 31 (2026-06-04).
 *
 * Textarea with @trigger detection → Select-style dropdown.
 */

import type { PopupPlacement } from '../popup/popup-spec.js';
import type { SelectOption } from '../select/option-spec.js';

/** A trigger-to-options mapping for multi-source mention. */
export interface MentionSource {
  /** The trigger character that activates this source. */
  readonly trigger: string;
  /** Options to show when this trigger is activated. */
  readonly options: readonly SelectOption[];
}

/** Custom filter function for mention options. */
export type MentionFilterFn = (
  query: string,
  options: readonly SelectOption[],
) => readonly SelectOption[];

export interface MentionProps {
  /** Textarea content value. */
  readonly value: string;
  /** Options to show in dropdown when trigger is activated. */
  readonly options: readonly SelectOption[];
  /** Trigger character. Default '@'. */
  readonly trigger: string;
  /** Dropdown placement. Default 'bottom-start'. */
  readonly placement: PopupPlacement;
  readonly disabled: boolean;
  readonly placeholder: string;
  /** Multi-source trigger-to-options mappings. Default []. */
  readonly sources: readonly MentionSource[];
  /** Custom filter function. Default undefined (uses built-in filter). */
  readonly filter: MentionFilterFn | undefined;
}

export const defaultMentionProps: MentionProps = {
  value: '',
  options: [],
  trigger: '@',
  placement: 'bottom-start',
  disabled: false,
  placeholder: '',
  sources: [],
  filter: undefined,
};

/**
 * Result of trigger detection at current cursor position.
 */
export interface MentionTriggerResult {
  /** Whether a trigger was detected. */
  readonly detected: boolean;
  /** The query text after the trigger character (up to cursor). */
  readonly query: string;
  /** Start index of the trigger + query in the value string. */
  readonly startIndex: number;
}

/**
 * Detect whether the cursor is immediately after a trigger pattern.
 *
 * Walks backward from `cursorIndex` looking for `trigger` character.
 * If found, extracts the text between trigger and cursor as the query.
 * Returns `{ detected: false }` if no trigger found.
 */
export function detectMentionTrigger(
  value: string,
  cursorIndex: number,
  trigger: string,
): MentionTriggerResult {
  if (cursorIndex <= 0) return { detected: false, query: '', startIndex: 0 };

  // Walk backward from cursor to find trigger character
  const textBeforeCursor = value.substring(0, cursorIndex);
  const triggerIndex = textBeforeCursor.lastIndexOf(trigger);

  if (triggerIndex < 0) return { detected: false, query: '', startIndex: 0 };

  // Validate: trigger should be at start or preceded by whitespace
  if (triggerIndex > 0) {
    const charBefore = value[triggerIndex - 1];
    if (charBefore !== ' ' && charBefore !== '\n' && charBefore !== '\t') {
      return { detected: false, query: '', startIndex: 0 };
    }
  }

  const query = value.substring(triggerIndex + trigger.length, cursorIndex);

  // Don't trigger if query contains whitespace (means user moved past)
  if (query.includes(' ') || query.includes('\n')) {
    return { detected: false, query: '', startIndex: 0 };
  }

  return {
    detected: true,
    query,
    startIndex: triggerIndex,
  };
}

/**
 * Detect which trigger (from a set of triggers) is active at the cursor.
 *
 * Walks backward from `cursorIndex` looking for ANY trigger character.
 * Returns which trigger matched + the query after it, or null if none found.
 * When multiple triggers could match, returns the one closest to the cursor.
 */
export function detectMultiMentionTrigger(
  value: string,
  cursorIndex: number,
  triggers: readonly string[],
): { matchedTrigger: string; query: string; triggerStart: number } | null {
  if (cursorIndex <= 0 || triggers.length === 0) return null;

  let bestIndex = -1;
  let bestTrigger: string | null = null;

  for (const t of triggers) {
    const textBeforeCursor = value.substring(0, cursorIndex);
    const idx = textBeforeCursor.lastIndexOf(t);
    if (idx < 0) continue;

    // Validate: trigger should be at start or preceded by whitespace
    if (idx > 0) {
      const charBefore = value[idx - 1];
      if (charBefore !== ' ' && charBefore !== '\n' && charBefore !== '\t') {
        continue;
      }
    }

    // Keep the trigger closest to cursor (highest index)
    if (idx > bestIndex) {
      bestIndex = idx;
      bestTrigger = t;
    }
  }

  if (bestIndex < 0 || bestTrigger === null) return null;

  const query = value.substring(bestIndex + bestTrigger.length, cursorIndex);

  // Don't trigger if query contains whitespace
  if (query.includes(' ') || query.includes('\n')) return null;

  return {
    matchedTrigger: bestTrigger,
    query,
    triggerStart: bestIndex,
  };
}
