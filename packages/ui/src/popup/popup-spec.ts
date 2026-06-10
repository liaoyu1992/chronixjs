/**
 * Popup / floating-element IR — Phase 4 (2026-06-02) per Phase 0.2 Decision A.1 / B.1.
 *
 * Pure-data types consumed by `resolvePopupPlacement` and emitted as
 * the placement result. Adapter packages (`@chronixjs/ui-vue3`,
 * `@chronixjs/ui-vue2`, `@chronixjs/ui-react`) wrap this IR with DOM
 * measurement + portal mounting + scroll/resize observation; the math
 * itself lives in the core and is framework-agnostic.
 */

/**
 * The 12 placement values supported by chronix-ui popup positioning.
 *
 * Naming convention follows the dominant floating-element library
 * vocabulary (`bottom-start`, `top-end`, etc.) so consumers can
 * port placement code between systems with minimal translation.
 *
 * - **Main axis** — first token (`top` / `bottom` / `left` / `right`).
 *   Determines which side of the anchor the popup sits on.
 * - **Alignment** — second token (`start` / `end`) or omitted
 *   (center). Determines how the popup aligns along the
 *   cross-axis relative to the anchor.
 */
export type PopupPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/**
 * Structural shape compatible with the browser's `DOMRect` (and
 * `getBoundingClientRect()` output) — but typed in chronix-ui without a
 * runtime dependency on the DOM library so the placer works in JSDOM
 * tests, Node SSR contexts, and non-browser environments.
 *
 * All 6 fields are required; callers measuring rects via
 * `getBoundingClientRect()` get all 6 for free. Callers synthesizing
 * a rect (e.g. tests, virtual anchors) must compute `right = left + width`
 * and `bottom = top + height` explicitly.
 */
export interface DOMRectLike {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly right: number;
  readonly bottom: number;
}

/**
 * Popup positioning specification. Supplied by the consumer / adapter
 * to describe the desired placement; the placer interprets this as a
 * preference (flips + clamps may produce a different actual placement
 * if the preferred placement overflows the viewport).
 */
export interface PopupSpec {
  /** Preferred placement; the placer may flip away from this if the popup overflows the viewport AND `flip` is true. */
  readonly placement: PopupPlacement;
  /**
   * Gap in pixels between the anchor edge and the popup edge along the
   * main axis. Default 4 (matches `defaultPopupSpec`). Note this is the
   * main-axis offset; cross-axis alignment is governed by the `-start` /
   * `-end` suffix on `placement`.
   */
  readonly offsetPx: number;
  /**
   * When `true`, the placer flips the main-axis direction (`top` ↔
   * `bottom`, `left` ↔ `right`) if the preferred direction has
   * insufficient space in the viewport. Alignment suffix is preserved
   * across the flip (`top-start` ↔ `bottom-start`). Default `true`.
   */
  readonly flip: boolean;
  /**
   * When `true`, the popup's effective width is forced to the anchor's
   * width (typical for Select / Cascader / DatePicker dropdowns). The
   * placer's result will include a non-null `widthPx` field carrying
   * this value, which the adapter applies as inline `style.width` on
   * the popup element. Default `false`.
   */
  readonly widthMatch: boolean;
  /**
   * Minimum gap in pixels between the popup and the viewport edge after
   * clamping. The placer keeps the popup inside `viewport` shrunk by
   * this padding on all four sides. Default 8.
   */
  readonly viewportPaddingPx: number;
}

/**
 * Input bag for `resolvePopupPlacement`.
 *
 * - `anchorRect` — anchor element's bounding rect (e.g.
 *   `anchor.getBoundingClientRect()`). All 6 DOMRectLike fields used.
 * - `popupRect` — popup element's bounding rect after measurement.
 *   Only `width` + `height` are read by the placer; `left/top/right/bottom`
 *   are ignored (the popup hasn't been placed yet — the placer's job is
 *   to compute its final position). Callers measuring with the popup
 *   mounted-but-hidden will have all 6 fields populated; that's fine.
 * - `viewportRect` — viewport bounds. Typically the document's visual
 *   viewport: `{ left: 0, top: 0, width: window.innerWidth, height:
 *   window.innerHeight, right: window.innerWidth, bottom: window.innerHeight
 *   }`. Custom scroll containers can pass their own rect to constrain
 *   the popup within a sub-region.
 * - `spec` — placement spec (see `PopupSpec` above).
 */
export interface PopupPlacementInput {
  readonly anchorRect: DOMRectLike;
  readonly popupRect: DOMRectLike;
  readonly viewportRect: DOMRectLike;
  readonly spec: PopupSpec;
}

/**
 * Result of `resolvePopupPlacement`. The adapter applies these as
 * inline `style` on the popup element:
 *
 * ```ts
 * popupEl.style.position = 'fixed';
 * popupEl.style.left = `${result.leftPx}px`;
 * popupEl.style.top = `${result.topPx}px`;
 * if (result.widthPx !== null) {
 *   popupEl.style.width = `${result.widthPx}px`;
 * }
 * ```
 */
export interface PopupPlacementResult {
  /** Final left coord in viewport-relative pixels (use with `position: fixed`). */
  readonly leftPx: number;
  /** Final top coord in viewport-relative pixels. */
  readonly topPx: number;
  /**
   * The placement actually applied. Differs from `spec.placement` only
   * when flip was triggered (`spec.flip: true` and the preferred
   * direction had insufficient space). Consumers reading this can adjust
   * arrow pointer direction, animation origin, etc. accordingly.
   */
  readonly actualPlacement: PopupPlacement;
  /**
   * When `spec.widthMatch: true`, this is the anchor's width — the
   * adapter forces the popup to this width. When `widthMatch: false`,
   * this is `null` and the popup's intrinsic width is preserved.
   */
  readonly widthPx: number | null;
}

/**
 * Sensible defaults for `PopupSpec`. Consumers spread + override:
 *
 * ```ts
 * const spec: PopupSpec = { ...defaultPopupSpec, placement: 'bottom-start' };
 * ```
 *
 * Default placement is `bottom` (the most common popover/tooltip
 * convention). Flip is on; widthMatch is off; offsets match the
 * chronix-ui design system's standard 4px gap and 8px viewport gutter.
 */
export const defaultPopupSpec: PopupSpec = {
  placement: 'bottom',
  offsetPx: 4,
  flip: true,
  widthMatch: false,
  viewportPaddingPx: 8,
};
