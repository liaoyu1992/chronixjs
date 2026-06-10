import { encodeMarqueeKeyframes } from './encode-marquee-keyframes.js';

/**
 * Marquee stylesheet — Phase 22 (2026-06-03).
 *
 * Root `<div>` is `overflow: hidden` so the off-edge copies of
 * the duplicated content stay clipped. Inner `__track` carries
 * the animation; for horizontal directions (left/right) the
 * track is `flex-direction: row` + `width: max-content`, for
 * vertical (up/down) `flex-direction: column` + `height:
 * max-content`. The browser GPU-composites the transform.
 *
 * The keyframes (4 directions) come from `encodeMarqueeKeyframes`
 * and are appended once at first injection.
 *
 * Two-level fallback (`var(--cx-ui-marquee-*, fallback)`) keeps
 * the surface readable without a `<ChronixUIProvider>`.
 */
export const CHRONIX_MARQUEE_CSS = `
.cx-ui-marquee {
  display: block;
  overflow: hidden;
  font-family: var(--cx-ui-font-family, system-ui, sans-serif);
  font-size: var(--cx-ui-marquee-font-size, 14px);
  color: var(--cx-ui-marquee-text-color, #1f2937);
}

.cx-ui-marquee__track {
  display: flex;
  /* animation set inline by adapter from props.direction +
     measured contentSize + props.speed. */
}

.cx-ui-marquee--direction-left .cx-ui-marquee__track,
.cx-ui-marquee--direction-right .cx-ui-marquee__track {
  flex-direction: row;
  width: max-content;
}

.cx-ui-marquee--direction-up .cx-ui-marquee__track,
.cx-ui-marquee--direction-down .cx-ui-marquee__track {
  flex-direction: column;
  height: max-content;
}

.cx-ui-marquee--pause-on-hover:hover .cx-ui-marquee__track {
  animation-play-state: paused;
}

${encodeMarqueeKeyframes()}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'marquee';

let injected = false;

/**
 * Inject the Marquee stylesheet into `document.head` exactly
 * once. Sticky-flag semantics — once injected (or detected) the
 * flag stays `true` even if the `<style>` element is later
 * removed by the consumer.
 */
export function ensureChronixMarqueeStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_MARQUEE_CSS;
  document.head.appendChild(style);
  injected = true;
}
