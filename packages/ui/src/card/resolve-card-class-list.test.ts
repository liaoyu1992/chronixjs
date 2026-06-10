import { describe, expect, it } from 'vitest';

import { defaultCardProps } from './card-spec.js';
import { resolveCardClassList } from './resolve-card-class-list.js';

describe('resolveCardClassList', () => {
  it('returns base + medium size + bordered for defaults (no title, no footer)', () => {
    expect(resolveCardClassList(defaultCardProps, false)).toEqual([
      'cx-ui-card',
      'cx-ui-card--medium',
      'cx-ui-card--bordered',
    ]);
  });

  it('reflects all 3 sizes', () => {
    for (const s of ['small', 'medium', 'large'] as const) {
      const classes = resolveCardClassList({ ...defaultCardProps, size: s }, false);
      expect(classes).toContain(`cx-ui-card--${s}`);
    }
  });

  it('adds --with-title when title is set', () => {
    expect(resolveCardClassList({ ...defaultCardProps, title: 'Hi' }, false)).toContain(
      'cx-ui-card--with-title',
    );
  });

  it('adds --with-footer when hasFooter is true', () => {
    expect(resolveCardClassList(defaultCardProps, true)).toContain('cx-ui-card--with-footer');
  });

  it('adds --hoverable + --embedded when those props are true', () => {
    const classes = resolveCardClassList(
      { ...defaultCardProps, hoverable: true, embedded: true },
      false,
    );
    expect(classes).toContain('cx-ui-card--hoverable');
    expect(classes).toContain('cx-ui-card--embedded');
  });

  it('omits --bordered when bordered=false', () => {
    expect(resolveCardClassList({ ...defaultCardProps, bordered: false }, false)).not.toContain(
      'cx-ui-card--bordered',
    );
  });
});
