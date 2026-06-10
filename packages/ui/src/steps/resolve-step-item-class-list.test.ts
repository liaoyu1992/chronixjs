import { describe, expect, it } from 'vitest';

import { resolveStepItemClassList } from './resolve-step-item-class-list.js';

describe('resolveStepItemClassList', () => {
  it('returns base + status for a non-current item', () => {
    expect(resolveStepItemClassList('wait', false)).toEqual([
      'cx-ui-steps__item',
      'cx-ui-steps__item--wait',
    ]);
  });

  it.each(['wait', 'process', 'finish', 'error'] as const)(
    'reflects status="%s" via the --{status} modifier',
    (status) => {
      expect(resolveStepItemClassList(status, false)).toContain(`cx-ui-steps__item--${status}`);
    },
  );

  it('adds --current when isCurrent is true', () => {
    expect(resolveStepItemClassList('process', true)).toContain('cx-ui-steps__item--current');
  });

  it('combines --current + --{status} when both apply', () => {
    const classes = resolveStepItemClassList('error', true);
    expect(classes).toContain('cx-ui-steps__item--error');
    expect(classes).toContain('cx-ui-steps__item--current');
  });

  it('returns a fresh array per call', () => {
    const a = resolveStepItemClassList('wait', false);
    const b = resolveStepItemClassList('wait', false);
    expect(a).not.toBe(b);
  });
});
