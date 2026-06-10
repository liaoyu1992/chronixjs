/**
 * chronix-ui form CSS — Phase 34 (2026-06-05).
 *
 * BEM CSS for ChronixForm + ChronixFormItem with CSS var tokens.
 * Injected idempotently via `ensureChronixFormStyles()`.
 */

// @vitest-environment happy-dom

export const CHRONIX_FORM_CSS = `
/* ── Form root ── */
.cx-ui-form {
  box-sizing: border-box;
  font-family: var(--cx-ui-font-family, inherit);
  font-size: var(--cx-ui-font-size, 14px);
  line-height: var(--cx-ui-line-height, 1.6);
  color: var(--cx-ui-text-color, #333);
}

.cx-ui-form--inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0 16px;
}

.cx-ui-form--top-label .cx-ui-form-item {
  display: grid;
  grid-template-areas:
    "label"
    "blank"
    "feedback";
  grid-template-rows: auto 1fr auto;
  margin-bottom: 20px;
}

.cx-ui-form--left-label .cx-ui-form-item {
  display: grid;
  grid-template-areas:
    "label blank"
    ".     feedback";
  grid-template-columns: var(--cx-ui-form-label-width, 80px) minmax(0, 1fr);
  margin-bottom: 20px;
}

/* ── Form item ── */
.cx-ui-form-item {
  box-sizing: border-box;
}

.cx-ui-form-item--small-size {
  font-size: var(--cx-ui-font-size-small, 12px);
}

.cx-ui-form-item--medium-size {
  font-size: var(--cx-ui-font-size, 14px);
}

.cx-ui-form-item--large-size {
  font-size: var(--cx-ui-font-size-large, 16px);
}

.cx-ui-form-item--no-label.cx-ui-form-item--left-labelled {
  /* left-labelled but no label — still keep grid columns for alignment */
}

.cx-ui-form-item--inline {
  display: inline-flex;
  align-items: center;
  margin-bottom: 0;
  gap: 8px;
}

/* ── Label ── */
.cx-ui-form-item-label {
  grid-area: label;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 0 12px 0 0;
  font-weight: 500;
  min-height: 32px;
  line-height: 1.6;
}

.cx-ui-form-item-label--center {
  justify-content: center;
  text-align: center;
}

.cx-ui-form-item-label--right {
  justify-content: flex-end;
  text-align: right;
}

.cx-ui-form-item-label__asterisk {
  color: var(--cx-ui-error-color, #d03050);
  margin-right: 2px;
  font-weight: 500;
}

.cx-ui-form-item-label__text {
  display: inline;
}

/* ── Blank (content wrapper) ── */
.cx-ui-form-item-blank {
  grid-area: blank;
  display: flex;
  align-items: center;
  min-height: 32px;
  box-sizing: border-box;
}

.cx-ui-form-item-blank--error {
  /* Error border handled by child input component via CSS var propagation */
}

/* ── Feedback ── */
.cx-ui-form-item-feedback {
  grid-area: feedback;
  box-sizing: border-box;
  padding: 4px 0 0 0;
  min-height: 20px;
  font-size: var(--cx-ui-feedback-font-size, 12px);
  line-height: 1.4;
  color: var(--cx-ui-text-color-3, #999);
}

.cx-ui-form-item-feedback--error {
  color: var(--cx-ui-error-color, #d03050);
}

.cx-ui-form-item-feedback__line {
  display: block;
}
`;

/* ── Sticky-flag injection ── */

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'form';
let injected = false;

/**
 * Inject `<style data-chronix-ui="form">` into `<head>` exactly once.
 * Safe to call from any adapter component mount hook.
 */
export function ensureChronixFormStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_FORM_CSS;
  document.head.appendChild(style);
  injected = true;
}
