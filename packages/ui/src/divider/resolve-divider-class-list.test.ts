import { describe, expect, it } from 'vitest';

import { defaultDividerProps } from './divider-spec.js';
import { resolveDividerClassList } from './resolve-divider-class-list.js';

describe('resolveDividerClassList', () => {
  it('returns base + horizontal for defaults without title', () => {
    expect(resolveDividerClassList(defaultDividerProps, false)).toEqual([
      'cx-ui-divider',
      'cx-ui-divider--horizontal',
    ]);
  });

  it('adds --with-title + --title-{placement} when title is present in horizontal mode', () => {
    expect(resolveDividerClassList(defaultDividerProps, true)).toEqual([
      'cx-ui-divider',
      'cx-ui-divider--horizontal',
      'cx-ui-divider--with-title',
      'cx-ui-divider--title-center',
    ]);
  });

  it('reflects titlePlacement in the class name', () => {
    for (const p of ['left', 'center', 'right'] as const) {
      const classes = resolveDividerClassList({ ...defaultDividerProps, titlePlacement: p }, true);
      expect(classes).toContain(`cx-ui-divider--title-${p}`);
    }
  });

  it('emits --vertical (not --horizontal) and suppresses title-* when vertical=true', () => {
    const classes = resolveDividerClassList(
      { ...defaultDividerProps, vertical: true, titlePlacement: 'left' },
      true,
    );
    expect(classes).toContain('cx-ui-divider--vertical');
    expect(classes).not.toContain('cx-ui-divider--horizontal');
    expect(classes).not.toContain('cx-ui-divider--with-title');
    expect(classes).not.toContain('cx-ui-divider--title-left');
  });

  it('adds --dashed when dashed=true', () => {
    expect(resolveDividerClassList({ ...defaultDividerProps, dashed: true }, false)).toContain(
      'cx-ui-divider--dashed',
    );
  });

  it('returns a fresh array per call (callers may mutate)', () => {
    const a = resolveDividerClassList(defaultDividerProps, false);
    const b = resolveDividerClassList(defaultDividerProps, false);
    expect(a).not.toBe(b);
  });
});
