/**
 * Focus-trap helpers — . Shared by Modal +
 * Drawer adapters' `useModalLifecycle` composable / hook to keep
 * keyboard focus inside the panel while it's open.
 *
 * Scope: pure DOM-traversal helpers; the keyboard-listener wiring +
 * `el.focus()` calls live at adapter scope (per-framework reactivity
 * + lifecycle hook differences).
 *
 * Out-of-scope (v0.2):
 * - Restoring focus to the previously-focused element on close
 *   (would require saving `document.activeElement` before open).
 * - `getComputedStyle`-aware filtering for ancestor `display: none`
 *   visibility checks (cheap property-only check ships in v0.1.0-alpha).
 * - `aria-hidden`-driven background hiding for screen-reader isolation.
 *
 * The KitFocusTrap promotion to `@chronixjs/cx-kit` can happen once
 * another package needs focus-trap helpers; for v0.1.0-alpha they
 * live here.
 */

/**
 * CSS selector covering the canonical interactive elements that
 * receive keyboard focus in browsers. Mirrors the standard "focusable
 * elements" pattern used by every focus-trap library — anchors with
 * `href`, enabled form controls, and any element with a non-`-1`
 * `tabindex`.
 */
export const DEFAULT_FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

/**
 * Return every focusable descendant of `root` in document order.
 * Filters out elements that are obviously not visible:
 *
 * - `disabled` (already handled by selector for form controls; this
 *   catches dynamically-disabled `<a>` etc.).
 * - `aria-hidden="true"`.
 * - Inline `style.display === 'none'` or `style.visibility === 'hidden'`
 *   (catches the common case; doesn't traverse ancestors via
 *   `getComputedStyle` — that's v0.2 work).
 *
 * The `root` itself is NOT included even if focusable.
 */
export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const matches = Array.from(root.querySelectorAll<HTMLElement>(DEFAULT_FOCUSABLE_SELECTOR));
  return matches.filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.style.display === 'none') return false;
    if (el.style.visibility === 'hidden') return false;
    return true;
  });
}

/**
 * Convenience: first focusable descendant of `root`, or `null` if
 * none exists. Used by Modal/Drawer adapters to set initial focus on
 * open.
 */
export function getFirstFocusable(root: HTMLElement): HTMLElement | null {
  return getFocusableElements(root)[0] ?? null;
}

/**
 * Convenience: last focusable descendant of `root`, or `null` if
 * none exists. Used by Modal/Drawer adapters to wrap focus when the
 * consumer Shift+Tabs past the first focusable element.
 */
export function getLastFocusable(root: HTMLElement): HTMLElement | null {
  const all = getFocusableElements(root);
  return all.length > 0 ? all[all.length - 1]! : null;
}
