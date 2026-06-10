import { describe, expect, it } from 'vitest';

import { resolveSpinClassList } from './resolve-spin-class-list.js';
import { defaultSpinProps } from './spin-spec.js';

describe('resolveSpinClassList', () => {
  it('returns base + medium for defaults (no description, show=true)', () => {
    expect(resolveSpinClassList(defaultSpinProps)).toEqual(['cx-ui-spin', 'cx-ui-spin--medium']);
  });

  it('reflects all 3 sizes', () => {
    for (const s of ['small', 'medium', 'large'] as const) {
      const classes = resolveSpinClassList({ ...defaultSpinProps, size: s });
      expect(classes).toContain(`cx-ui-spin--${s}`);
    }
  });

  it('adds --with-description when description is a non-empty string', () => {
    expect(resolveSpinClassList({ ...defaultSpinProps, description: 'Loading' })).toContain(
      'cx-ui-spin--with-description',
    );
  });

  it('adds --with-description even when description is empty string (presence, not truthiness)', () => {
    expect(resolveSpinClassList({ ...defaultSpinProps, description: '' })).toContain(
      'cx-ui-spin--with-description',
    );
  });

  it('omits --with-description when description is undefined', () => {
    expect(resolveSpinClassList({ ...defaultSpinProps, description: undefined })).not.toContain(
      'cx-ui-spin--with-description',
    );
  });

  it('adds --hidden when show=false', () => {
    expect(resolveSpinClassList({ ...defaultSpinProps, show: false })).toContain(
      'cx-ui-spin--hidden',
    );
  });

  it('omits --hidden when show=true (default)', () => {
    expect(resolveSpinClassList(defaultSpinProps)).not.toContain('cx-ui-spin--hidden');
  });

  it('returns a fresh array per call (callers may mutate)', () => {
    const a = resolveSpinClassList(defaultSpinProps);
    const b = resolveSpinClassList(defaultSpinProps);
    expect(a).not.toBe(b);
  });
});
