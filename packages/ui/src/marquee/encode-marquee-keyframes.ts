/**
 * Encode the CSS `@keyframes` rules used by the Marquee
 * animation.
 *
 * Phase 22 (2026-06-03). Decision D.1 — Marquee scrolls via pure
 * CSS animation, not via a JS RAF loop. The keyframes here
 * translate the `__track` element from `0` to `-50%` (because the
 * `__track` contains TWO copies of the slot content, the
 * 50%-translate visually equals one full content cycle and the
 * loop is seamless).
 *
 * Keyframe names are uniquely namespaced (`cx-ui-marquee-scroll-{direction}`)
 * to avoid collisions with consumer-page CSS (Phase 22 22-fr2
 * friction note). The returned string is appended to the chronix
 * stylesheet via `ensureChronixMarqueeStyles()`.
 *
 * Returns a single string with all 4 keyframes (left / right / up
 * / down) so the consumer-side animation property picks the right
 * direction by name.
 */
export function encodeMarqueeKeyframes(): string {
  return `
@keyframes cx-ui-marquee-scroll-left {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes cx-ui-marquee-scroll-right {
  from { transform: translateX(-50%); }
  to { transform: translateX(0); }
}

@keyframes cx-ui-marquee-scroll-up {
  from { transform: translateY(0); }
  to { transform: translateY(-50%); }
}

@keyframes cx-ui-marquee-scroll-down {
  from { transform: translateY(-50%); }
  to { transform: translateY(0); }
}
`;
}
