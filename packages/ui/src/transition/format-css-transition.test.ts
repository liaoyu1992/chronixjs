import { describe, expect, it } from 'vitest';

import { formatCssTransitionShorthand } from './format-css-transition.js';
import { defaultTransitionSpec, type TransitionSpec } from './transition-spec.js';

describe('formatCssTransitionShorthand', () => {
  it('single property with default spec', () => {
    expect(formatCssTransitionShorthand(['opacity'], defaultTransitionSpec)).toBe(
      'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    );
  });

  it('multiple properties produce comma-separated entries', () => {
    expect(formatCssTransitionShorthand(['opacity', 'transform'], defaultTransitionSpec)).toBe(
      'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    );
  });

  it('custom duration + easing', () => {
    const spec: TransitionSpec = { durationMs: 350, easing: 'ease-out', delayMs: 0 };
    expect(formatCssTransitionShorthand(['width'], spec)).toBe('width 350ms ease-out');
  });

  it('non-zero delay is appended', () => {
    const spec: TransitionSpec = { durationMs: 200, easing: 'linear', delayMs: 50 };
    expect(formatCssTransitionShorthand(['opacity'], spec)).toBe('opacity 200ms linear 50ms');
  });

  it('zero delay is omitted (default + explicit 0 produce same output)', () => {
    const noDelay: TransitionSpec = { durationMs: 200, easing: 'linear', delayMs: 0 };
    expect(formatCssTransitionShorthand(['opacity'], noDelay)).toBe('opacity 200ms linear');
  });

  it('delay is repeated per property in comma-separated form', () => {
    const spec: TransitionSpec = { durationMs: 200, easing: 'ease', delayMs: 25 };
    expect(formatCssTransitionShorthand(['opacity', 'transform'], spec)).toBe(
      'opacity 200ms ease 25ms, transform 200ms ease 25ms',
    );
  });

  it('empty properties array returns empty string', () => {
    expect(formatCssTransitionShorthand([], defaultTransitionSpec)).toBe('');
  });

  it('preserves complex easing strings (cubic-bezier, steps)', () => {
    const spec: TransitionSpec = {
      durationMs: 500,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      delayMs: 0,
    };
    expect(formatCssTransitionShorthand(['transform'], spec)).toContain(
      'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    );
  });
});
