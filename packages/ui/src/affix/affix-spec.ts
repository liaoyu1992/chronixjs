/**
 * Affix component IR — . Tier B scroll-position
 * trigger: fixes a child element to the viewport when its natural
 * scroll position passes a `top` or `bottom` threshold.
 *
 * Pure-data IR ships the prop shape only — placement math + scroll
 * observation lives at adapter scope (per-framework `window.scroll`
 * listener + `getBoundingClientRect` of a placeholder element).
 *
 * Out-of-scope:
 * - Container scroll (instead of window).
 * - Dynamic top / bottom offset adjustment.
 * - IntersectionObserver-based variant.
 */

export interface AffixProps {
  /**
   * Distance in px from the viewport's top edge when affixed.
   * `undefined` = don't affix to the top.
   */
  readonly top: number | undefined;
  /**
   * Distance in px from the viewport's bottom edge when affixed.
   * `undefined` = don't affix to the bottom.
   */
  readonly bottom: number | undefined;
}

export const defaultAffixProps: AffixProps = {
  top: undefined,
  bottom: undefined,
};

/**
 * Pure helper: given the current placeholder rect + viewport size +
 * thresholds, decide whether the content should be affixed and what
 * inline style to apply.
 *
 * Adapter passes the placeholder's `getBoundingClientRect()` + the
 * `top` / `bottom` props; this returns:
 *
 * - `affixed: boolean` — whether to apply `position: fixed`.
 * - `inlineStyle: Record<string, string>` — partial style to merge
 *   onto the affixed content element. Empty when not affixed.
 *
 * Behavior:
 * - When `top` is defined and `placeholderRect.top < top` → affix
 *   with `position: fixed; top: ${top}px; left: ${placeholderRect.left}px;
 *   width: ${placeholderRect.width}px`.
 * - Else when `bottom` is defined and `placeholderRect.bottom >
 *   viewportHeight - bottom` → affix with `position: fixed; bottom:
 *   ${bottom}px; ...`.
 * - Otherwise → not affixed (empty style; let the content sit
 *   inline).
 */
export interface AffixResolveInput {
  readonly top: number | undefined;
  readonly bottom: number | undefined;
  readonly placeholderRect: {
    readonly top: number;
    readonly bottom: number;
    readonly left: number;
    readonly width: number;
  };
  readonly viewportHeight: number;
}

export interface AffixResolveResult {
  readonly affixed: boolean;
  readonly inlineStyle: Record<string, string>;
}

export function resolveAffixState(input: AffixResolveInput): AffixResolveResult {
  const { top, bottom, placeholderRect, viewportHeight } = input;
  if (top !== undefined && placeholderRect.top < top) {
    return {
      affixed: true,
      inlineStyle: {
        position: 'fixed',
        top: `${top}px`,
        left: `${placeholderRect.left}px`,
        width: `${placeholderRect.width}px`,
      },
    };
  }
  if (bottom !== undefined && placeholderRect.bottom > viewportHeight - bottom) {
    return {
      affixed: true,
      inlineStyle: {
        position: 'fixed',
        bottom: `${bottom}px`,
        left: `${placeholderRect.left}px`,
        width: `${placeholderRect.width}px`,
      },
    };
  }
  return { affixed: false, inlineStyle: {} };
}
