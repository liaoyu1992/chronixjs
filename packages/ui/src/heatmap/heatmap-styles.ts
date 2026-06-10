export const CHRONIX_HEATMAP_CSS = `
.cx-ui-heatmap {
  display: inline-block;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
}

.cx-ui-heatmap__cell {
  stroke: var(--cx-ui-heatmap-cell-stroke, #ffffff);
  stroke-width: 1;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'heatmap';

let injected = false;

export function ensureChronixHeatmapStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_HEATMAP_CSS;
  document.head.appendChild(style);
  injected = true;
}
