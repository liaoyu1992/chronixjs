/**
 * PageHeader stylesheet — Phase 19 (2026-06-02).
 *
 * Layout: main row (back? + avatar? + heading + extra?) + optional
 * content + optional footer. Heading is a column of title (medium-
 * bold) + optional subtitle (muted). Inverted variant flips
 * background + text-color tokens for dark-surface usage.
 *
 * Two-level fallback (`var(--cx-ui-page-header-*, fallback)`) keeps
 * the surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_PAGE_HEADER_CSS = `
.cx-ui-page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  color: var(--cx-ui-page-header-text-color, #1f2937);
  background: var(--cx-ui-page-header-bg, transparent);
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-page-header-font-size, 14px);
  border-bottom: 1px solid var(--cx-ui-page-header-border-color, transparent);
}

.cx-ui-page-header__main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cx-ui-page-header__back-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--cx-ui-page-header-back-size, 28px);
  height: var(--cx-ui-page-header-back-size, 28px);
  border: 1px solid var(--cx-ui-page-header-back-border-color, #d1d5db);
  background: var(--cx-ui-page-header-back-bg, transparent);
  color: inherit;
  border-radius: var(--cx-ui-page-header-back-border-radius, 4px);
  font-size: var(--cx-ui-page-header-back-font-size, 16px);
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.cx-ui-page-header__back-button:hover {
  background: var(--cx-ui-page-header-back-hover-bg, rgba(0, 0, 0, 0.04));
}

.cx-ui-page-header__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cx-ui-page-header__heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.cx-ui-page-header__title {
  font-weight: var(--cx-ui-page-header-title-font-weight, 600);
  font-size: var(--cx-ui-page-header-title-font-size, 18px);
  color: var(--cx-ui-page-header-title-color, #1f2937);
  line-height: 1.3;
}

.cx-ui-page-header__subtitle {
  color: var(--cx-ui-page-header-subtitle-color, #6b7280);
  font-size: var(--cx-ui-page-header-subtitle-font-size, 13px);
  line-height: 1.3;
}

.cx-ui-page-header__extra {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.cx-ui-page-header__content {
  color: var(--cx-ui-page-header-content-color, #374151);
}

.cx-ui-page-header__footer {
  padding-top: 4px;
  border-top: 1px dashed var(--cx-ui-page-header-footer-border-color, transparent);
  color: var(--cx-ui-page-header-footer-color, #6b7280);
}

.cx-ui-page-header--inverted {
  background: var(--cx-ui-page-header-bg-inverted, #1f2937);
  color: var(--cx-ui-page-header-text-color-inverted, #f9fafb);
}

.cx-ui-page-header--inverted .cx-ui-page-header__title {
  color: var(--cx-ui-page-header-title-color-inverted, #f9fafb);
}

.cx-ui-page-header--inverted .cx-ui-page-header__subtitle {
  color: var(--cx-ui-page-header-subtitle-color-inverted, #d1d5db);
}

.cx-ui-page-header--inverted .cx-ui-page-header__back-button {
  border-color: var(--cx-ui-page-header-back-border-color-inverted, #4b5563);
  color: inherit;
}

.cx-ui-page-header--inverted .cx-ui-page-header__back-button:hover {
  background: var(--cx-ui-page-header-back-hover-bg-inverted, rgba(255, 255, 255, 0.08));
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'page-header';

let injected = false;

/**
 * Inject the PageHeader stylesheet into `document.head` exactly once.
 * Sticky-flag semantics — once injected (or detected) the flag stays
 * `true` even if the `<style>` element is later removed by the
 * consumer.
 */
export function ensureChronixPageHeaderStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_PAGE_HEADER_CSS;
  document.head.appendChild(style);
  injected = true;
}
