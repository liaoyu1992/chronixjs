import { describe, expect, it } from 'vitest';

import { defaultBadgeProps } from './badge-spec.js';
import { resolveBadgeClassList, resolveBadgeSupClassList } from './resolve-badge-class-list.js';

describe('resolveBadgeClassList (root)', () => {
  it('returns just the base class when not standalone', () => {
    expect(resolveBadgeClassList(defaultBadgeProps, false)).toEqual(['cx-ui-badge']);
  });

  it('adds --standalone when there is no wrapped child', () => {
    expect(resolveBadgeClassList(defaultBadgeProps, true)).toEqual([
      'cx-ui-badge',
      'cx-ui-badge--standalone',
    ]);
  });

  it('returns a fresh array per call (callers may mutate)', () => {
    const a = resolveBadgeClassList(defaultBadgeProps, false);
    const b = resolveBadgeClassList(defaultBadgeProps, false);
    expect(a).not.toBe(b);
  });
});

describe('resolveBadgeSupClassList (indicator)', () => {
  it('returns base + default type for default props', () => {
    expect(resolveBadgeSupClassList(defaultBadgeProps)).toEqual([
      'cx-ui-badge__sup',
      'cx-ui-badge__sup--default',
    ]);
  });

  it('reflects the type prop', () => {
    for (const t of ['default', 'success', 'warning', 'error', 'info'] as const) {
      const classes = resolveBadgeSupClassList({ ...defaultBadgeProps, type: t });
      expect(classes).toContain(`cx-ui-badge__sup--${t}`);
    }
  });

  it('adds --dot when dot=true', () => {
    expect(resolveBadgeSupClassList({ ...defaultBadgeProps, dot: true })).toContain(
      'cx-ui-badge__sup--dot',
    );
  });

  it('adds --processing when processing=true', () => {
    expect(resolveBadgeSupClassList({ ...defaultBadgeProps, processing: true })).toContain(
      'cx-ui-badge__sup--processing',
    );
  });

  it('adds --hidden when show=false', () => {
    expect(resolveBadgeSupClassList({ ...defaultBadgeProps, show: false })).toContain(
      'cx-ui-badge__sup--hidden',
    );
  });

  it('omits --hidden when show=true (default)', () => {
    expect(resolveBadgeSupClassList(defaultBadgeProps)).not.toContain('cx-ui-badge__sup--hidden');
  });
});
