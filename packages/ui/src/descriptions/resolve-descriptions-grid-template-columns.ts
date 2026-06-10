/**
 * Compute the `grid-template-columns` inline-style value for a
 * Descriptions grid with `columns` equal-fraction tracks.
 *
 * Phase 21 (2026-06-03). Item-side mirror of Phase 17 Grid's
 * `resolveGridTracks(cols)` for the `number` shortcut form
 * (`number → 'repeat(N, minmax(0, 1fr))'`). Descriptions ships
 * this as a Descriptions-namespaced helper to keep the
 * cross-component import graph clean — the Phase 17 helper
 * accepts `number | string | undefined`; Descriptions only needs
 * the number form.
 *
 * The output string is the value of the inline `style.gridTemplateColumns`
 * attribute applied to the `__grid` element. Browser-serialization
 * of `minmax(0, 1fr)` back-reads as `minmax(0px, 1fr)` (Phase 17
 * 17-fr1 friction note); core IR tests assert the pre-serialization
 * form, Playwright assertions use regex.
 */
export function resolveDescriptionsGridTemplateColumns(columns: number): string {
  return `repeat(${columns}, minmax(0, 1fr))`;
}
