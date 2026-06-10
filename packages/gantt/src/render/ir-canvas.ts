/**
 * Anti-regression hook #5: the imperative paint escape hatch.
 *
 * Any render node may expose an `IRCanvas` to opt out of the standard
 * DOM/SVG path and paint itself directly into a Canvas2D context. Used
 * for performance-critical paths — dense grid backgrounds, thousands of
 * bars in a virtualized pane — where DOM diffing would dominate.
 *
 * The implementer is responsible for handling `dpr` correctly (scale the
 * transform matrix once at draw entry; emit logical coordinates).
 */
export interface IRCanvas {
  draw(ctx: CanvasRenderingContext2D, dpr: number): void;
}
