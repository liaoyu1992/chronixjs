/**
 * Button stylesheet — Phase 12 (2026-06-02).
 *
 * Hoisted from `adapters/ui-vue3/src/components/chronix-button-styles.ts`
 * into the framework-agnostic core so all 3 adapters (vue3 / vue2 /
 * react) share the same CSS string + injection function. This makes
 * cross-adapter visual parity automatic — none of the adapters owns
 * the CSS independently.
 *
 * Tokens live in the `button` slice of `ChronixUITheme` (Phase 1).
 * Two-level fallback (`var(--cx-ui-button-*, fallback)`) keeps buttons
 * readable even when no `<ChronixUIProvider>` is mounted.
 *
 * Tier B/C components ship their own `*-styles.ts` under
 * `packages/ui/src/{component}/` with the same `ensure*Styles()`
 * dedup pattern; a future Phase ~25 finale may consolidate them into
 * a single stylesheet entry-point for SSR convenience.
 */
export const CHRONIX_BUTTON_CSS = `
.cx-ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  cursor: pointer;
  border: 1px solid;
  border-radius: var(--cx-ui-button-border-radius, 3px);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-weight: var(--cx-ui-button-font-weight, 400);
  line-height: 1;
  user-select: none;
  outline: none;
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
              border-color 150ms cubic-bezier(0.4, 0, 0.2, 1),
              color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
.cx-ui-button:focus-visible {
  box-shadow: 0 0 0 2px var(--cx-ui-border-color-focus, #18a058);
}

/* Size modifiers */
.cx-ui-button--small {
  height: var(--cx-ui-height-small, 28px);
  padding: 0 var(--cx-ui-button-padding-x-small, 10px);
  font-size: var(--cx-ui-font-size-small, 12px);
}
.cx-ui-button--medium {
  height: var(--cx-ui-height-medium, 34px);
  padding: 0 var(--cx-ui-button-padding-x, 14px);
  font-size: var(--cx-ui-font-size, 14px);
}
.cx-ui-button--large {
  height: var(--cx-ui-height-large, 40px);
  padding: 0 var(--cx-ui-button-padding-x-large, 18px);
  font-size: var(--cx-ui-font-size-large, 16px);
}

/* Default variant */
.cx-ui-button--default {
  background-color: var(--cx-ui-button-bg-color, #ffffff);
  color: var(--cx-ui-button-text-color, #1f2937);
  border-color: var(--cx-ui-button-border-color, #e5e7eb);
}
.cx-ui-button--default:hover {
  background-color: var(--cx-ui-button-bg-color-hover, #f3f4f6);
  border-color: var(--cx-ui-button-border-color-hover, #36ad6a);
}
.cx-ui-button--default:active {
  background-color: var(--cx-ui-button-bg-color-pressed, #e5e7eb);
}

/* Primary variant */
.cx-ui-button--primary {
  background-color: var(--cx-ui-button-bg-color-primary, #18a058);
  color: var(--cx-ui-button-text-color-primary, #ffffff);
  border-color: var(--cx-ui-button-bg-color-primary, #18a058);
}
.cx-ui-button--primary:hover {
  background-color: var(--cx-ui-button-bg-color-primary-hover, #36ad6a);
  border-color: var(--cx-ui-button-bg-color-primary-hover, #36ad6a);
}
.cx-ui-button--primary:active {
  background-color: var(--cx-ui-button-bg-color-primary-pressed, #0c7a43);
  border-color: var(--cx-ui-button-bg-color-primary-pressed, #0c7a43);
}

/* Disabled state — applies regardless of variant; wins over hover/active */
.cx-ui-button--disabled,
.cx-ui-button--disabled:hover,
.cx-ui-button--disabled:active {
  cursor: not-allowed;
  opacity: 0.6;
}
.cx-ui-button--disabled.cx-ui-button--default {
  background-color: var(--cx-ui-button-bg-color, #ffffff);
  border-color: var(--cx-ui-button-border-color, #e5e7eb);
}
.cx-ui-button--disabled.cx-ui-button--primary {
  background-color: var(--cx-ui-button-bg-color-primary, #18a058);
  border-color: var(--cx-ui-button-bg-color-primary, #18a058);
}

/* Block variant — full-width */
.cx-ui-button--block {
  display: flex;
  width: 100%;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'button';

let injected = false;

/**
 * Inject the Button stylesheet into `document.head` exactly once per
 * browser document. Safe to call from any adapter component setup —
 * no-op on subsequent calls and on the server (no `document`).
 *
 * The injected `<style>` element carries `data-chronix-ui="button"` so
 * tests + devtools can identify chronix-ui-managed styles. The DOM
 * lookup before `appendChild` defends against duplicated workspace
 * deps that would otherwise stamp multiple `<style>` tags into the
 * same document.
 */
export function ensureChronixButtonStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_BUTTON_CSS;
  document.head.appendChild(style);
  injected = true;
}
