import { DEFAULT_ICONS } from './default-icons.js';

import type { IconSpec } from './icon-spec.js';

/**
 * Process-global icon registry keyed by `IconSpec.name`. Phase 9
 * (2026-06-02). Mirrors the `localeRegistry` pattern (Phase 3):
 * append-only, no delete API, pre-registered with chronix-NEW defaults
 * at module load.
 *
 * Pre-registered icons (12) — see `./default-icons.ts` for the full
 * list and their typical consumers.
 *
 * Consumers register additional icons at app boot:
 *
 * ```ts
 * registerIcon({
 *   name: 'my-brand-logo',
 *   viewBox: '0 0 32 32',
 *   paths: [{ d: 'M...' }],
 * });
 * ```
 *
 * Re-registering an existing name (e.g. overriding the default `close`
 * icon with a thicker version) is supported — latest registration wins.
 */

const REGISTRY = new Map<string, IconSpec>();

for (const icon of DEFAULT_ICONS) {
  REGISTRY.set(icon.name, icon);
}

/**
 * Register an `IconSpec` in the registry. Returns the registered spec
 * (for chaining). If an icon with the same `name` is already registered,
 * it is replaced.
 */
export function registerIcon(spec: IconSpec): IconSpec {
  REGISTRY.set(spec.name, spec);
  return spec;
}

/**
 * Look up an `IconSpec` by name. Returns `undefined` for unknown names —
 * caller decides whether to fall back to a default or surface the miss.
 *
 * Returns by REFERENCE; callers should treat the spec as immutable
 * (register a new spec with the same name to "modify" an icon).
 */
export function getIcon(name: string): IconSpec | undefined {
  return REGISTRY.get(name);
}

/** Cheap presence check. Avoids the spec lookup when only the boolean is needed. */
export function hasIcon(name: string): boolean {
  return REGISTRY.has(name);
}

/**
 * Return all currently-registered icon names, sorted alphabetically.
 * Each call produces a fresh array so the caller can mutate freely.
 *
 * Useful for icon-picker UIs, devtools listings, and diagnostic output.
 */
export function listIconNames(): readonly string[] {
  return [...REGISTRY.keys()].sort();
}
