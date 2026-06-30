import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * **URL-query-driven demo config layer for the chronix-react
 * demo.**
 *
 * React adaptation of `examples/gantt-vue3/src/demo-config.ts`. The
 * field-factory layer (`bool` / `str` / `num` / `enumOf` /
 * `describeConfigSchema`) is framework-agnostic and identical to
 * vue3/vue2. The hook (`useDemoConfig`) uses `useState` to hold
 * per-field values + `useEffect` to write changes back to
 * `history.replaceState`, replacing vue's `ref` + `watch` pair.
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfigField = ConfigField<any>;

/**
 * Public hook return shape. For each schema key, `values[K]` holds the
 * current value + `setters[K]` writes a new one (updating React state +
 * the URL via the next-tick `useEffect`). `schema` echoes the input so
 * the URL-docs `<details>` panel can iterate without a closure capture.
 * `resetAll()` resets every field to its default and strips the query
 * string.
 */
export interface UseDemoConfigResult<S extends Readonly<Record<string, AnyConfigField>>> {
  readonly values: {
    readonly [K in keyof S]: S[K] extends ConfigField<infer T> ? T : never;
  };
  readonly setters: {
    readonly [K in keyof S]: (value: S[K] extends ConfigField<infer T> ? T : never) => void;
  };
  readonly schema: S;
  readonly resetAll: () => void;
}

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
  const newUrl = window.location.pathname + (qs.length > 0 ? `?${qs}` : '') + window.location.hash;
  window.history.replaceState(null, '', newUrl);
}

/**
 * Read the current URL once on mount, initialize one piece of React
 * state per schema field, and write back to the URL whenever any
 * field changes. The setters are stable across renders; the values
 * object is memoized so consumers can pass `cfg.values.editable`
 * into `useMemo` deps without churning.
 *
 * Returns `{ values, setters, schema, resetAll() }`.
 */
export function useDemoConfig<S extends Readonly<Record<string, AnyConfigField>>>(
  schema: S,
): UseDemoConfigResult<S> {
  // Pin the schema reference so the per-effect setters always see the
  // same parse / serialize callbacks. Schema mutation between renders
  // is not supported (demos declare it as a module-scope `as const`).
  const schemaRef = useRef(schema);
  schemaRef.current = schema;

  // Initialize React state from the URL once. The initializer fn form
  // ensures URL is read only at mount.
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const params = readSearchParams();
    const initial: Record<string, unknown> = {};
    for (const key of Object.keys(schema)) {
      const field = schema[key]!;
      const raw = params.get(key);
      initial[key] = field.parse(raw);
    }
    return initial;
  });

  // Write current state back to the URL after every change. One
  // `useEffect` covers all fields; URLSearchParams is read fresh each
  // time so unrelated query params survive untouched.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = readSearchParams();
    for (const key of Object.keys(schemaRef.current)) {
      const field = schemaRef.current[key]!;
      const serialized = field.serialize(values[key]);
      if (serialized === null) {
        params.delete(key);
      } else {
        params.set(key, serialized);
      }
    }
    writeSearchParams(params);
  }, [values]);

  // Build per-key setters. Stable across renders (memoized on schema
  // identity, which is itself pinned via schemaRef above).
  const setters = useMemo(() => {
    const out: Record<string, (v: unknown) => void> = {};
    for (const key of Object.keys(schema)) {
      out[key] = (v: unknown) => setValues((prev) => ({ ...prev, [key]: v }));
    }
    return out;
  }, [schema]);

  const resetAll = useCallback((): void => {
    const next: Record<string, unknown> = {};
    for (const key of Object.keys(schemaRef.current)) {
      next[key] = schemaRef.current[key]!.default;
    }
    setValues(next);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    }
  }, []);

  return {
    values: values as UseDemoConfigResult<S>['values'],
    setters: setters as UseDemoConfigResult<S>['setters'],
    schema,
    resetAll,
  };
}

/**
 * Render-helper for the URL-schema `<details>` panel below the
 * chart. Returns one human-readable line per schema field.
 */
export function describeConfigSchema<S extends Readonly<Record<string, AnyConfigField>>>(
  schema: S,
): readonly { key: string; defaultValue: string; description: string }[] {
  return Object.keys(schema).map((key) => {
    const field = schema[key]!;
    const def: unknown = field.default;
    let defaultValue: string;
    if (def === undefined) {
      defaultValue = '(unset)';
    } else if (typeof def === 'string' || typeof def === 'number' || typeof def === 'boolean') {
      defaultValue = String(def);
    } else {
      defaultValue = JSON.stringify(def);
    }
    return {
      key,
      defaultValue,
      description: field.description ?? '',
    };
  });
}
