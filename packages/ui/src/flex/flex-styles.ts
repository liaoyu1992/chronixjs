/**
 * Flex stylesheet — Phase 17 (2026-06-02).
 *
 * Single-element flex container; per-instance `gap` value comes
 * from inline `style="gap: ..."` set by the adapter via
 * `resolveFlexGap`. Class modifiers encode direction / wrap /
 * align / justify state.
 */
export const CHRONIX_FLEX_CSS = `
.cx-ui-flex {
  display: flex;
}

.cx-ui-flex--inline { display: inline-flex; }

/* Direction */
.cx-ui-flex--direction-row { flex-direction: row; }
.cx-ui-flex--direction-column { flex-direction: column; }
.cx-ui-flex--direction-row-reverse { flex-direction: row-reverse; }
.cx-ui-flex--direction-column-reverse { flex-direction: column-reverse; }

/* Wrap */
.cx-ui-flex--wrap-nowrap { flex-wrap: nowrap; }
.cx-ui-flex--wrap-wrap { flex-wrap: wrap; }
.cx-ui-flex--wrap-wrap-reverse { flex-wrap: wrap-reverse; }

/* Cross-axis alignment */
.cx-ui-flex--align-start { align-items: flex-start; }
.cx-ui-flex--align-center { align-items: center; }
.cx-ui-flex--align-end { align-items: flex-end; }
.cx-ui-flex--align-baseline { align-items: baseline; }
.cx-ui-flex--align-stretch { align-items: stretch; }

/* Main-axis justification */
.cx-ui-flex--justify-start { justify-content: flex-start; }
.cx-ui-flex--justify-center { justify-content: center; }
.cx-ui-flex--justify-end { justify-content: flex-end; }
.cx-ui-flex--justify-space-around { justify-content: space-around; }
.cx-ui-flex--justify-space-between { justify-content: space-between; }
.cx-ui-flex--justify-space-evenly { justify-content: space-evenly; }
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'flex';

let injected = false;

/**
 * Inject the Flex stylesheet into `document.head` exactly once.
 * Sticky-flag semantics.
 */
export function ensureChronixFlexStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_FLEX_CSS;
  document.head.appendChild(style);
  injected = true;
}
