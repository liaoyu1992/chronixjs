import { defaultEnUSLocale, defaultJaJPLocale, defaultZhCNLocale } from './chronix-locale.js';

import type { ChronixLocale } from './chronix-locale.js';

/**
 * Runtime registry of `ChronixLocale` instances keyed by their `name`
 * field (BCP 47 tag). .
 *
 * Pre-registered at module init:
 *
 * - `'en-US'` → `defaultEnUSLocale`
 * - `'zh-CN'` → `defaultZhCNLocale`
 * - `'ja-JP'` → `defaultJaJPLocale`
 *
 * Consumers can register additional locales at runtime (e.g. `'de-DE'`,
 * `'fr-FR'`) via `registerLocale`. The registry is process-global —
 * `getLocale(name)` returns the latest registration for that name.
 *
 * The registry exists for cases where the adapter or consumer code
 * needs to resolve a locale by string name (e.g. reading a user's
 * preferred-language setting from cookies / localStorage / a backend
 * profile). For static, build-time locale selection, consumers can
 * import the preset directly without touching the registry.
 *
 * Implementation note: a `Map<string, ChronixLocale>` backs the
 * registry. The wrapper API + lazy initialization protect callers from
 * needing to import `Map` directly and from race conditions during the
 * initial registration of the 3 presets.
 */

const REGISTRY = new Map<string, ChronixLocale>();

// Pre-register the 3 presets at module load.
REGISTRY.set(defaultEnUSLocale.name, defaultEnUSLocale);
REGISTRY.set(defaultZhCNLocale.name, defaultZhCNLocale);
REGISTRY.set(defaultJaJPLocale.name, defaultJaJPLocale);

/**
 * Register a `ChronixLocale` in the process-global registry. If a
 * locale with the same `name` is already registered, it is replaced —
 * the latest registration wins. Returns the locale that was just
 * registered (for chaining).
 *
 * Consumers typically call this once at app boot:
 *
 * ```ts
 * registerLocale({
 *   name: 'de-DE',
 *   common: { ok: 'OK', cancel: 'Abbrechen', ... },
 * });
 * ```
 *
 * The registry is intentionally NOT exposed as a mutable Map — going
 * through `registerLocale` makes registrations greppable and provides
 * a single hook point if the registry ever needs eventing (e.g. notify
 * adapter providers that a new locale became available).
 */
export function registerLocale(locale: ChronixLocale): ChronixLocale {
  REGISTRY.set(locale.name, locale);
  return locale;
}

/**
 * Look up a `ChronixLocale` by its BCP 47 name. Returns `undefined` if
 * no locale is registered under that name — caller decides whether to
 * fall back to a default (e.g. `defaultEnUSLocale`) or to surface the
 * miss as an error.
 *
 * Returns the registered locale by REFERENCE; callers should treat the
 * result as immutable (use `mergeLocales` to derive a modified copy).
 */
export function getLocale(name: string): ChronixLocale | undefined {
  return REGISTRY.get(name);
}

/**
 * Return whether a locale with the given name is registered. Cheaper
 * than `getLocale(name) !== undefined` when the caller doesn't need the
 * locale object itself.
 */
export function hasLocale(name: string): boolean {
  return REGISTRY.has(name);
}

/**
 * Return the names of every registered locale, sorted alphabetically.
 * Stable order across calls (re-sorted each call so caller doesn't
 * observe registration order).
 *
 * Useful for building locale-picker UIs or for diagnostic / dev-tools
 * output that lists what's available.
 */
export function listLocaleNames(): readonly string[] {
  return [...REGISTRY.keys()].sort();
}
