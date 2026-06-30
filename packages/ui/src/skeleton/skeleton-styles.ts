/**
 * Skeleton stylesheet — .
 *
 * Single-element placeholder: solid background color + optional
 * shimmer animation via a linear-gradient with shifting background
 * position. Consumers stack multiple instances to build multi-line
 * placeholders; per-instance sizing comes from inline-style
 * `style="width: …; height: …"` set by the adapter from
 * `formatSkeletonSize`.
 *
 * Two-level fallback (`var(--cx-ui-skeleton-*, fallback)`) keeps the
 * placeholder visible without a `<ChronixUIProvider>`.
 */
export const CHRONIX_SKELETON_CSS = `
.cx-ui-skeleton {
  display: block;
  background-color: var(--cx-ui-skeleton-color, #e5e7eb);
  border-radius: var(--cx-ui-skeleton-border-radius, 3px);
}

/* Shape modifiers — drive base size defaults; consumers override via
   inline style.width / style.height when needed. */
.cx-ui-skeleton--text {
  width: 100%;
  height: var(--cx-ui-skeleton-text-height, 1em);
}

.cx-ui-skeleton--rect {
  width: 100%;
  height: var(--cx-ui-skeleton-rect-height, 60px);
}

.cx-ui-skeleton--circle {
  width: var(--cx-ui-skeleton-circle-size, 36px);
  height: var(--cx-ui-skeleton-circle-size, 36px);
  border-radius: 50%;
}

/* Round — pill-ended placeholder; ignored by circle shape because
   --circle already sets border-radius: 50% which wins (CSS source
   order favors the later, more specific rule). */
.cx-ui-skeleton--round {
  border-radius: 999px;
}

/* Shimmer animation — linear-gradient that shifts background-position
   to fake a sweeping highlight. */
.cx-ui-skeleton--animated {
  background-image: linear-gradient(
    90deg,
    var(--cx-ui-skeleton-color, #e5e7eb) 25%,
    var(--cx-ui-skeleton-highlight, #f3f4f6) 37%,
    var(--cx-ui-skeleton-color, #e5e7eb) 63%
  );
  background-size: 400% 100%;
  animation: cx-ui-skeleton-shimmer 1.4s ease infinite;
}

@keyframes cx-ui-skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
`;

const INJECTED_DATA_ATTR = 'data-chronix-ui';
const COMPONENT_NAME = 'skeleton';

let injected = false;

/**
 * Inject the Skeleton stylesheet into `document.head` exactly once.
 * Sticky-flag semantics.
 */
export function ensureChronixSkeletonStyles(): void {
  if (injected) return;
  if (typeof document === 'undefined') return;
  const existing = document.head.querySelector(`style[${INJECTED_DATA_ATTR}="${COMPONENT_NAME}"]`);
  if (existing) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.setAttribute(INJECTED_DATA_ATTR, COMPONENT_NAME);
  style.textContent = CHRONIX_SKELETON_CSS;
  document.head.appendChild(style);
  injected = true;
}
