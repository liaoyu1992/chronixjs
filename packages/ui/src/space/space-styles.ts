/**
 * Space stylesheet — .
 *
 * Single-element flex container; per-instance `gap` value comes from
 * inline `style="gap: ..."` set by the adapter via `resolveSpaceGap`.
 * Class modifiers encode the qualitative direction / wrap / align /
 * justify state; CSS rules map them to flexbox properties.
 */
export const CHRONIX_SPACE_CSS = `
.cx-ui-space {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}

.cx-ui-space--inline { display: inline-flex; }
.cx-ui-space--vertical { flex-direction: column; }
.cx-ui-space--wrap { flex-wrap: wrap; }

/* Cross-axis alignment */
.cx-ui-space--align-start { align-items: flex-start; }
.cx-ui-space--align-center { align-items: center; }
.cx-ui-space--align-end { align-items: flex-end; }
.cx-ui-space--align-baseline { align-items: baseline; }
.cx-ui-space--align-stretch { align-items: stretch; }

/* Main-axis justification */
.cx-ui-space--justify-start { justify-content: flex-start; }
.cx-ui-space--justify-center { justify-content: center; }
.cx-ui-space--justify-end { justify-content: flex-end; }
.cx-ui-space--justify-space-around { justify-content: space-around; }
.cx-ui-space--justify-space-between { justify-content: space-between; }
.cx-ui-space--justify-space-evenly { justify-content: space-evenly; }
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'space';

let injected = false;

/**
 * Inject the Space stylesheet into `document.head` exactly once.
 * Sticky-flag semantics.
 */
export function ensureChronixSpaceStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_SPACE_CSS;
  document.head.appendChild(style);
  injected = true;
}
