import { describe, expect, it } from 'vitest';

import {
  buildFadeTransitionStyles,
  buildHeightCollapseTransitionStyles,
  buildSlideTransitionStyles,
  buildZoomTransitionStyles,
} from './transition-phase-styles.js';
import { defaultTransitionSpec, type TransitionSpec } from './transition-spec.js';

const SLOW_SPEC: TransitionSpec = { durationMs: 500, easing: 'ease', delayMs: 0 };

describe('buildFadeTransitionStyles', () => {
  it('produces the 6 phase styles', () => {
    const s = buildFadeTransitionStyles();
    expect(Object.keys(s).sort()).toEqual(
      [
        'enterActiveStyle',
        'enterFromStyle',
        'enterToStyle',
        'leaveActiveStyle',
        'leaveFromStyle',
        'leaveToStyle',
      ].sort(),
    );
  });

  it('fades opacity 0 → 1 on enter and 1 → 0 on leave', () => {
    const s = buildFadeTransitionStyles();
    expect(s.enterFromStyle).toEqual({ opacity: '0' });
    expect(s.enterToStyle).toEqual({ opacity: '1' });
    expect(s.leaveFromStyle).toEqual({ opacity: '1' });
    expect(s.leaveToStyle).toEqual({ opacity: '0' });
  });

  it('active phases carry the transition shorthand', () => {
    const s = buildFadeTransitionStyles();
    expect(s.enterActiveStyle).toEqual({
      transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    });
    expect(s.leaveActiveStyle).toEqual(s.enterActiveStyle);
  });

  it('honors a custom spec', () => {
    const s = buildFadeTransitionStyles({ spec: SLOW_SPEC });
    expect(s.enterActiveStyle['transition']).toBe('opacity 500ms ease');
  });
});

describe('buildZoomTransitionStyles', () => {
  it('combines opacity + transform with default scaleFrom 0.85', () => {
    const s = buildZoomTransitionStyles();
    expect(s.enterFromStyle).toEqual({ opacity: '0', transform: 'scale(0.85)' });
    expect(s.enterToStyle).toEqual({ opacity: '1', transform: 'scale(1)' });
    expect(s.leaveFromStyle).toEqual({ opacity: '1', transform: 'scale(1)' });
    expect(s.leaveToStyle).toEqual({ opacity: '0', transform: 'scale(0.85)' });
  });

  it('honors custom scaleFrom', () => {
    const s = buildZoomTransitionStyles({ scaleFrom: 0.5 });
    expect(s.enterFromStyle['transform']).toBe('scale(0.5)');
    expect(s.leaveToStyle['transform']).toBe('scale(0.5)');
  });

  it('active phases contain both opacity + transform in the shorthand', () => {
    const s = buildZoomTransitionStyles();
    expect(s.enterActiveStyle['transition']).toContain('opacity');
    expect(s.enterActiveStyle['transition']).toContain('transform');
  });

  it('honors a custom spec', () => {
    const s = buildZoomTransitionStyles({ spec: SLOW_SPEC });
    expect(s.enterActiveStyle['transition']).toBe('opacity 500ms ease, transform 500ms ease');
  });
});

describe('buildSlideTransitionStyles', () => {
  it('from-top: starts above destination, slides down into place', () => {
    const s = buildSlideTransitionStyles({ from: 'from-top' });
    expect(s.enterFromStyle).toEqual({ opacity: '0', transform: 'translate(0, -20px)' });
    expect(s.enterToStyle).toEqual({ opacity: '1', transform: 'translate(0, 0)' });
  });

  it('from-bottom: starts below destination, slides up into place', () => {
    const s = buildSlideTransitionStyles({ from: 'from-bottom' });
    expect(s.enterFromStyle['transform']).toBe('translate(0, 20px)');
  });

  it('from-left: starts left of destination, slides right into place', () => {
    const s = buildSlideTransitionStyles({ from: 'from-left' });
    expect(s.enterFromStyle['transform']).toBe('translate(-20px, 0)');
  });

  it('from-right: starts right of destination, slides left into place', () => {
    const s = buildSlideTransitionStyles({ from: 'from-right' });
    expect(s.enterFromStyle['transform']).toBe('translate(20px, 0)');
  });

  it('leave reverses to the origin direction (back to from-position)', () => {
    const s = buildSlideTransitionStyles({ from: 'from-bottom' });
    expect(s.leaveToStyle['transform']).toBe('translate(0, 20px)');
    expect(s.leaveFromStyle['transform']).toBe('translate(0, 0)');
  });

  it('honors custom distancePx (e.g. drawer width)', () => {
    const s = buildSlideTransitionStyles({ from: 'from-right', distancePx: 320 });
    expect(s.enterFromStyle['transform']).toBe('translate(320px, 0)');
    expect(s.leaveToStyle['transform']).toBe('translate(320px, 0)');
  });

  it('honors a custom spec', () => {
    const s = buildSlideTransitionStyles({ from: 'from-top', spec: SLOW_SPEC });
    expect(s.enterActiveStyle['transition']).toBe('opacity 500ms ease, transform 500ms ease');
  });
});

describe('buildHeightCollapseTransitionStyles', () => {
  it('produces height 0 ↔ scrollHeightPx with overflow hidden across all 6 phases', () => {
    const s = buildHeightCollapseTransitionStyles({ scrollHeightPx: 120 });
    expect(s.enterFromStyle).toEqual({ height: '0px', overflow: 'hidden' });
    expect(s.enterToStyle).toEqual({ height: '120px', overflow: 'hidden' });
    expect(s.leaveFromStyle).toEqual({ height: '120px', overflow: 'hidden' });
    expect(s.leaveToStyle).toEqual({ height: '0px', overflow: 'hidden' });
  });

  it('active phases carry the height transition shorthand + overflow hidden', () => {
    const s = buildHeightCollapseTransitionStyles({ scrollHeightPx: 50 });
    expect(s.enterActiveStyle['transition']).toContain('height');
    expect(s.enterActiveStyle['transition']).toContain('200ms');
    expect(s.enterActiveStyle['overflow']).toBe('hidden');
    expect(s.leaveActiveStyle).toEqual(s.enterActiveStyle);
  });

  it('handles 0 scrollHeightPx without producing NaN', () => {
    const s = buildHeightCollapseTransitionStyles({ scrollHeightPx: 0 });
    expect(s.enterToStyle['height']).toBe('0px');
    expect(s.leaveFromStyle['height']).toBe('0px');
  });

  it('honors a custom spec', () => {
    const slow: TransitionSpec = { durationMs: 400, easing: 'ease-out', delayMs: 0 };
    const s = buildHeightCollapseTransitionStyles({ scrollHeightPx: 200, spec: slow });
    expect(s.enterActiveStyle['transition']).toBe('height 400ms ease-out');
  });

  it('rounds nothing — passes scrollHeightPx through verbatim', () => {
    const s = buildHeightCollapseTransitionStyles({ scrollHeightPx: 73 });
    expect(s.enterToStyle['height']).toBe('73px');
  });
});

describe('TransitionPhaseStyles — common invariants', () => {
  it('enter and leave active styles are identical (both just carry the transition shorthand)', () => {
    expect(buildFadeTransitionStyles().enterActiveStyle).toEqual(
      buildFadeTransitionStyles().leaveActiveStyle,
    );
    expect(buildZoomTransitionStyles().enterActiveStyle).toEqual(
      buildZoomTransitionStyles().leaveActiveStyle,
    );
    expect(buildSlideTransitionStyles({ from: 'from-bottom' }).enterActiveStyle).toEqual(
      buildSlideTransitionStyles({ from: 'from-bottom' }).leaveActiveStyle,
    );
  });

  it('default spec produces the expected duration in active shorthand', () => {
    const fade = buildFadeTransitionStyles();
    expect(fade.enterActiveStyle['transition']).toContain(`${defaultTransitionSpec.durationMs}ms`);
  });
});
