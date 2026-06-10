/**
 * BackTop component IR — Phase 27 (2026-06-03). Tier B floating
 * "back to top" button. Shown when `window.scrollY >=
 * visibilityThreshold`. Click scrolls to top via `window.scrollTo`.
 *
 * Pure-data IR + 2 pure helpers; everything else lives at adapter
 * scope (scroll listener + button click handler).
 *
 * Out-of-scope:
 * - Container scroll (window-only in v0.1.0-alpha).
 * - Show/hide CSS transition (snaps in/out via conditional render).
 * - Custom progress ring around button.
 */

export type BackTopBehavior = 'smooth' | 'auto';

export interface BackTopProps {
  /** Show when `window.scrollY >= visibilityThreshold`. */
  readonly visibilityThreshold: number;
  /** Inline `right: ${n}px` on the floating button. */
  readonly right: number;
  /** Inline `bottom: ${n}px`. */
  readonly bottom: number;
  /** Passed to `ScrollOptions.behavior` for the scroll-to-top call. */
  readonly behavior: BackTopBehavior;
}

export const defaultBackTopProps: BackTopProps = {
  visibilityThreshold: 100,
  right: 40,
  bottom: 40,
  behavior: 'smooth',
};

/**
 * Decide whether the button should be visible given the current
 * scroll position.
 */
export function shouldShowBackTop(input: {
  readonly scrollY: number;
  readonly visibilityThreshold: number;
}): boolean {
  return input.scrollY >= input.visibilityThreshold;
}

/**
 * Compose the inline-style record for the floating button. Adapters
 * merge this with their per-framework style attribute.
 */
export function resolveBackTopStyle(input: {
  readonly right: number;
  readonly bottom: number;
}): Record<string, string> {
  return {
    position: 'fixed',
    right: `${input.right}px`,
    bottom: `${input.bottom}px`,
  };
}
