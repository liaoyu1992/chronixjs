/**
 * Phase 112 (2026-06-01): pluggable persistence backend for the
 * advanced-filter typeahead recent rings (Phase 100.2.5).
 *
 * The adapter holds one `TypeaheadRecentStorage` per SFC instance.
 * On mount it `read`s each slot's ring into the in-memory map; on
 * every `pushToRecent` it `write`s the new ring back.
 *
 * Two factory functions cover v1:
 *
 * - `createMemoryRecentStorage()` — no-op read (returns `[]`) + no-op
 *   write. Matches the Phase 100.2.5 chronix-first NO-storage
 *   precedent. This is the default when the SFC prop
 *   `typeaheadRecentStorage` is `'memory'` or unset.
 *
 * - `createLocalStorageRecentStorage(keyPrefix)` — reads + writes
 *   `${keyPrefix}::${slot}` JSON-encoded string arrays from / to
 *   `window.localStorage`. SSR-safe (returns empty rings when
 *   `window` is undefined). Quota / parse errors are swallowed
 *   silently — recent rings are non-critical UX state.
 *
 * Future backends (`sessionStorage`, `indexedDB`, consumer-supplied
 * `{ read, write }`) plug in by adding factory functions; the
 * adapter prop is a discriminated union literal at the SFC layer.
 */

export interface TypeaheadRecentStorage {
  readonly read: (slot: string) => readonly string[];
  readonly write: (slot: string, ring: readonly string[]) => void;
}

const EMPTY_RING: readonly string[] = Object.freeze([]);

export function createMemoryRecentStorage(): TypeaheadRecentStorage {
  return {
    read: () => EMPTY_RING,
    write: () => undefined,
  };
}

export function createLocalStorageRecentStorage(keyPrefix: string): TypeaheadRecentStorage {
  return {
    read: (slot) => {
      const storage = safeGetLocalStorage();
      if (storage == null) return EMPTY_RING;
      try {
        const raw = storage.getItem(`${keyPrefix}::${slot}`);
        if (raw == null) return EMPTY_RING;
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return EMPTY_RING;
        const out: string[] = [];
        for (const item of parsed) {
          if (typeof item === 'string') out.push(item);
        }
        return out;
      } catch {
        return EMPTY_RING;
      }
    },
    write: (slot, ring) => {
      const storage = safeGetLocalStorage();
      if (storage == null) return;
      try {
        storage.setItem(`${keyPrefix}::${slot}`, JSON.stringify(ring));
      } catch {
        // QuotaExceededError, SecurityError (private-mode in Safari), etc. —
        // swallow silently. Recent rings are non-critical UX state.
      }
    },
  };
}

function safeGetLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    const storage = window.localStorage;
    if (storage == null) return null;
    return storage;
  } catch {
    // SecurityError when cookies / localStorage are disabled by user
    return null;
  }
}

export const DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX = 'cx-table-typeahead-recent';
