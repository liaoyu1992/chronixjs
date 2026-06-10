import { formatCssTransitionShorthand } from './format-css-transition.js';
import { defaultTransitionSpec, type TransitionSpec } from './transition-spec.js';

/**
 * Per-phase inline style snapshots for a 6-phase enter/leave transition.
 *
 * Phase model matches Vue's `<Transition>` and React's
 * `react-transition-group`:
 *
 * - **Enter**: `enterFromStyle` (initial state) → mount + apply
 *   `enterActiveStyle` (contains `transition:` shorthand) → on next
 *   frame apply `enterToStyle` (final state).
 * - **Leave**: `leaveFromStyle` (current state) → apply `leaveActiveStyle`
 *   → on next frame apply `leaveToStyle` (initial state) → after
 *   transition ends, unmount.
 *
 * Adapters consume these by setting inline `style` (per-framework
 * mechanism) and listening for `transitionend` to advance phases.
 *
 * Phase 8 (2026-06-02).
 */
export interface TransitionPhaseStyles {
  readonly enterFromStyle: Record<string, string>;
  readonly enterActiveStyle: Record<string, string>;
  readonly enterToStyle: Record<string, string>;
  readonly leaveFromStyle: Record<string, string>;
  readonly leaveActiveStyle: Record<string, string>;
  readonly leaveToStyle: Record<string, string>;
}

/**
 * Build per-phase styles for a pure-fade transition (opacity 0 ↔ 1).
 *
 * Use for: tooltips, ghost overlays, generic appearance/disappearance
 * where no positional motion is needed.
 */
export function buildFadeTransitionStyles(input?: {
  readonly spec?: TransitionSpec;
}): TransitionPhaseStyles {
  const spec = input?.spec ?? defaultTransitionSpec;
  const transitionShorthand = formatCssTransitionShorthand(['opacity'], spec);
  return {
    enterFromStyle: { opacity: '0' },
    enterActiveStyle: { transition: transitionShorthand },
    enterToStyle: { opacity: '1' },
    leaveFromStyle: { opacity: '1' },
    leaveActiveStyle: { transition: transitionShorthand },
    leaveToStyle: { opacity: '0' },
  };
}

/**
 * Build per-phase styles for a zoom transition: opacity fade combined
 * with a `scale()` transform.
 *
 * Use for: Modal, Dialog, ColorPicker popover, and any overlay that
 * should feel attached to a center point rather than sliding from an
 * edge.
 *
 * `scaleFrom` defaults to `0.85` — small enough to read as motion,
 * large enough not to feel "tiny dot growing".
 */
export function buildZoomTransitionStyles(input?: {
  readonly spec?: TransitionSpec;
  readonly scaleFrom?: number;
}): TransitionPhaseStyles {
  const spec = input?.spec ?? defaultTransitionSpec;
  const scaleFrom = input?.scaleFrom ?? 0.85;
  const transitionShorthand = formatCssTransitionShorthand(['opacity', 'transform'], spec);
  const fromTransform = `scale(${scaleFrom})`;
  const toTransform = 'scale(1)';
  return {
    enterFromStyle: { opacity: '0', transform: fromTransform },
    enterActiveStyle: { transition: transitionShorthand },
    enterToStyle: { opacity: '1', transform: toTransform },
    leaveFromStyle: { opacity: '1', transform: toTransform },
    leaveActiveStyle: { transition: transitionShorthand },
    leaveToStyle: { opacity: '0', transform: fromTransform },
  };
}

/**
 * Direction the element animates FROM (and back to on leave). Naming
 * is unambiguous about source: `'from-top'` means the element enters
 * from the top edge of its destination and slides downward into place.
 */
export type SlideDirection = 'from-top' | 'from-bottom' | 'from-left' | 'from-right';

/**
 * Build per-phase styles for a slide transition: opacity fade combined
 * with a directional `translate()` transform.
 *
 * Use for: Drawer (from-left / from-right / from-top / from-bottom),
 * Popover (typically from the side opposite its placement), Toast
 * notifications (from-top / from-bottom).
 *
 * `distancePx` defaults to `20` — enough motion to read as "sliding
 * in" without feeling teleported. Drawers typically need a much larger
 * value (e.g. their own width) which the consumer passes explicitly.
 */
export function buildSlideTransitionStyles(input: {
  readonly from: SlideDirection;
  readonly spec?: TransitionSpec;
  readonly distancePx?: number;
}): TransitionPhaseStyles {
  const spec = input.spec ?? defaultTransitionSpec;
  const distance = input.distancePx ?? 20;
  const transitionShorthand = formatCssTransitionShorthand(['opacity', 'transform'], spec);
  const fromTransform = slideFromTransform(input.from, distance);
  const toTransform = 'translate(0, 0)';
  return {
    enterFromStyle: { opacity: '0', transform: fromTransform },
    enterActiveStyle: { transition: transitionShorthand },
    enterToStyle: { opacity: '1', transform: toTransform },
    leaveFromStyle: { opacity: '1', transform: toTransform },
    leaveActiveStyle: { transition: transitionShorthand },
    leaveToStyle: { opacity: '0', transform: fromTransform },
  };
}

function slideFromTransform(direction: SlideDirection, distancePx: number): string {
  switch (direction) {
    case 'from-top':
      return `translate(0, -${distancePx}px)`;
    case 'from-bottom':
      return `translate(0, ${distancePx}px)`;
    case 'from-left':
      return `translate(-${distancePx}px, 0)`;
    case 'from-right':
      return `translate(${distancePx}px, 0)`;
  }
}

/**
 * Build per-phase styles for a height-collapse transition (height 0
 * ↔ measured `scrollHeight`).
 *
 * Phase 28 (2026-06-04). Phase 8 deferred this builder because height
 * animation requires DOM measurement at adapter scope — the IR can
 * still ship the pure-data styles once the adapter has resolved
 * `scrollHeightPx`. Adapter consumes by:
 *
 * 1. Reading `element.scrollHeight` after the content mounts (Vue
 *    `nextTick`, React `useLayoutEffect`).
 * 2. Passing it as `scrollHeightPx` to this builder.
 * 3. Applying the 6 phase styles in order across `transitionend`
 *    callbacks (or a `setTimeout(durationMs)` fallback).
 *
 * Out-of-scope (v0.2):
 * - Auto-resize after expand (height locked at the measured value).
 * - Custom easing per call beyond `spec.easing`.
 */
export function buildHeightCollapseTransitionStyles(input: {
  readonly spec?: TransitionSpec;
  readonly scrollHeightPx: number;
}): TransitionPhaseStyles {
  const spec = input.spec ?? defaultTransitionSpec;
  const transitionShorthand = formatCssTransitionShorthand(['height'], spec);
  const expanded = `${input.scrollHeightPx}px`;
  return {
    enterFromStyle: { height: '0px', overflow: 'hidden' },
    enterActiveStyle: { transition: transitionShorthand, overflow: 'hidden' },
    enterToStyle: { height: expanded, overflow: 'hidden' },
    leaveFromStyle: { height: expanded, overflow: 'hidden' },
    leaveActiveStyle: { transition: transitionShorthand, overflow: 'hidden' },
    leaveToStyle: { height: '0px', overflow: 'hidden' },
  };
}
