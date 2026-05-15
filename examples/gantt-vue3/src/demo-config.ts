import { ref, watch, type Ref } from 'vue';

/**
 * **Phase 20.6: URL-query-driven demo config layer.**
 *
 * The chronix-gantt-vue3 demo has grown 10 toggleable options
 * across Phase 4 / 17 / 19 / 20. Each one was hand-wired as
 * `ref()` + computed prop + checkbox + reset clause — about
 * ~30 LOC per toggle. With ~80 more phases ahead, naive growth
 * would put the demo at ~5000 LOC of plumbing alone.
 *
 * This module exposes `useDemoConfig(schema)` which builds a
 * reactive config bag from URL query parameters. Each schema
 * field declares its type + default + description; the URL is
 * source of truth (shareable, reload-safe, parity-test friendly).
 *
 * SSR-safe: every URL touch is gated by `typeof window`.
 */

/**
 * One field's parse / serialize contract. `parse(null)` is the
 * "missing from URL" case — must return the default. `serialize`
 * returns `null` for default values so the URL stays clean when
 * the user resets a toggle to its default.
 */
export interface ConfigField<T> {
  readonly default: T;
  readonly parse: (raw: string | null) => T;
  readonly serialize: (value: T) => string | null;
  readonly description?: string;
}

/** Boolean field. URL form: `?key=true|false`. Missing → default. */
export function bool(defaultValue: boolean, description?: string): ConfigField<boolean> {
  return {
    default: defaultValue,
    parse: (raw) => (raw === null ? defaultValue : raw === 'true'),
    serialize: (v) => (v === defaultValue ? null : String(v)),
    ...(description ? { description } : {}),
  };
}

/**
 * Optional-string field. URL form: `?key=<value>` (URL-decoded).
 * Missing → defaultValue (which can itself be undefined for
 * "no value at all").
 */
export function str<T extends string>(
  defaultValue: T | undefined,
  description?: string,
): ConfigField<T | undefined> {
  return {
    default: defaultValue,
    parse: (raw) => (raw === null ? defaultValue : (raw as T)),
    serialize: (v) => (v === defaultValue ? null : (v ?? null)),
    ...(description ? { description } : {}),
  };
}

/** Numeric field. URL form: `?key=<float>`. NaN values fall through to default. */
export function num(defaultValue: number, description?: string): ConfigField<number> {
  return {
    default: defaultValue,
    parse: (raw) => {
      if (raw === null) return defaultValue;
      const parsed = Number.parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : defaultValue;
    },
    serialize: (v) => (v === defaultValue ? null : String(v)),
    ...(description ? { description } : {}),
  };
}

/**
 * String-literal-union field. URL value must be in the allowed
 * set or it falls back to the default. URL form: `?key=<one of values>`.
 */
export function enumOf<T extends string>(
  values: readonly T[],
  defaultValue: T,
  description?: string,
): ConfigField<T> {
  return {
    default: defaultValue,
    parse: (raw) => (raw !== null && values.includes(raw as T) ? (raw as T) : defaultValue),
    serialize: (v) => (v === defaultValue ? null : v),
    ...(description ? { description } : {}),
  };
}

/**
 * Read the current URL's search params, then turn each schema
 * field into a `Ref<T>` initialized from the parsed URL value.
 * Each `ref` is watched: on change, the URL is rewritten via
 * `history.replaceState` with the new query (preserving other
 * params and the current path). Default-value writes strip the
 * key from the URL so shareable links stay terse.
 *
 * Returns `{ ...refs, schema, resetAll() }` where `schema` is
 * the input echo (useful for the URL-doc panel) and `resetAll`
 * resets every field to its default + strips the query string.
 */
export type ConfigRefs<S extends Readonly<Record<string, ConfigField<any>>>> = {
  readonly [K in keyof S]: Ref<S[K] extends ConfigField<infer T> ? T : never>;
} & {
  readonly schema: S;
  readonly resetAll: () => void;
};

/**
 * Build the search-params instance for the current URL. Returns a
 * fresh URLSearchParams that callers mutate, then `pushState`.
 * SSR-safe: returns an empty `URLSearchParams` when `window` is
 * undefined.
 */
function readSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

/**
 * Write a URLSearchParams back into the browser URL via
 * `history.replaceState`. No-op when `window` is undefined.
 * Empty params yield a URL without `?` for clean shareable links.
 */
function writeSearchParams(params: URLSearchParams): void {
  if (typeof window === 'undefined') return;
  const qs = params.toString();
  const newUrl =
    window.location.pathname + (qs.length > 0 ? `?${qs}` : '') + window.location.hash;
  window.history.replaceState(null, '', newUrl);
}

export function useDemoConfig<S extends Readonly<Record<string, ConfigField<any>>>>(
  schema: S,
): ConfigRefs<S> {
  const params = readSearchParams();

  // Build one ref per field, initial value parsed from URL.
  const refs: Record<string, Ref<unknown>> = {};
  for (const key of Object.keys(schema)) {
    const field = schema[key]!;
    const raw = params.get(key);
    refs[key] = ref(field.parse(raw));
  }

  // Watch each ref and write back to URL on change. Single shared
  // params instance — each watcher reads the current `window.location`
  // fresh so concurrent updates from other panels don't clobber
  // each other.
  for (const key of Object.keys(schema)) {
    const field = schema[key]!;
    watch(refs[key]!, (value) => {
      const current = readSearchParams();
      const serialized = field.serialize(value);
      if (serialized === null) {
        current.delete(key);
      } else {
        current.set(key, serialized);
      }
      writeSearchParams(current);
    });
  }

  const resetAll = (): void => {
    for (const key of Object.keys(schema)) {
      const field = schema[key]!;
      refs[key]!.value = field.default;
    }
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
  };

  // Cast through `unknown` — TypeScript can't track the per-key
  // generic in the dynamic-object loop above. The public interface
  // (`ConfigRefs<S>`) preserves the per-key types for callers.
  return {
    ...(refs as unknown as ConfigRefs<S>),
    schema,
    resetAll,
  };
}

/**
 * Render-helper for the URL-schema `<details>` panel below the
 * chart. Returns one human-readable line per schema field.
 */
export function describeConfigSchema<
  S extends Readonly<Record<string, ConfigField<any>>>,
>(schema: S): readonly { key: string; defaultValue: string; description: string }[] {
  return Object.keys(schema).map((key) => {
    const field = schema[key]!;
    const def = field.default;
    return {
      key,
      defaultValue: def === undefined ? '(unset)' : String(def),
      description: field.description ?? '',
    };
  });
}
