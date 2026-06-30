/**
 * Watermark stylesheet — .
 *
 * The root `<div>` carries the SVG data-URI as inline
 * `background-image`, with `background-repeat: repeat` +
 * `background-size: {width}px {height}px` so the browser auto-
 * tiles the SVG. A `position: relative` root + `__content` child
 * keeps the underlying slot content stacked normally; the
 * background pattern is `z-index: 0` and `pointer-events: none`
 * via the root.
 *
 * Note: chronix-ui v0.1.0 Watermark renders the data-URI directly
 * on the root element (NOT a `::before` pseudo-element) so the
 * slot content remains the only child of the root in the DOM.
 * Consumers wanting click-through behavior can wrap the
 * Watermark inside their own positioned container; the root
 * itself does not block clicks because the SVG is a background
 * image (not a sibling element).
 */
export const CHRONIX_WATERMARK_CSS = `
.cx-ui-watermark {
  position: relative;
  background-repeat: repeat;
  /* background-image + background-size set inline by adapter via
     encodeWatermarkSvgDataUrl + props.width/height. */
}

.cx-ui-watermark__content {
  position: relative;
  z-index: 1;
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'watermark';

let injected = false;

/**
 * Inject the Watermark stylesheet into `document.head` exactly
 * once. Sticky-flag semantics — once injected (or detected) the
 * flag stays `true` even if the `<style>` element is later
 * removed by the consumer.
 */
export function ensureChronixWatermarkStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_WATERMARK_CSS;
  document.head.appendChild(style);
  injected = true;
}
