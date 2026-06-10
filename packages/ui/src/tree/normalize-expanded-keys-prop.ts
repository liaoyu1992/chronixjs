export function normalizeExpandedKeysProp(
  keys: ReadonlySet<string> | readonly string[] | undefined,
): ReadonlySet<string> {
  if (keys === undefined) return new Set();
  if (keys instanceof Set) return keys;
  return new Set(keys);
}
