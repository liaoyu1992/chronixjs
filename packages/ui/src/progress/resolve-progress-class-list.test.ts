import { describe, expect, it } from 'vitest';

import { defaultProgressProps } from './progress-spec.js';
import { resolveProgressClassList } from './resolve-progress-class-list.js';

describe('resolveProgressClassList', () => {
  it('returns base + default + with-info + info-outside for defaults', () => {
    expect(resolveProgressClassList(defaultProgressProps)).toEqual([
      'cx-ui-progress',
      'cx-ui-progress--default',
      'cx-ui-progress--with-info',
      'cx-ui-progress--info-outside',
    ]);
  });

  it('reflects all 5 type modifiers', () => {
    for (const t of ['default', 'success', 'warning', 'error', 'info'] as const) {
      const classes = resolveProgressClassList({ ...defaultProgressProps, type: t });
      expect(classes).toContain(`cx-ui-progress--${t}`);
    }
  });

  it('omits both --with-info and --info-* when showInfo is false', () => {
    const classes = resolveProgressClassList({ ...defaultProgressProps, showInfo: false });
    expect(classes).not.toContain('cx-ui-progress--with-info');
    expect(classes).not.toContain('cx-ui-progress--info-outside');
    expect(classes).not.toContain('cx-ui-progress--info-inside');
  });

  it('reflects info placement (inside vs outside)', () => {
    expect(
      resolveProgressClassList({ ...defaultProgressProps, indicatorPlacement: 'inside' }),
    ).toContain('cx-ui-progress--info-inside');
    expect(
      resolveProgressClassList({ ...defaultProgressProps, indicatorPlacement: 'outside' }),
    ).toContain('cx-ui-progress--info-outside');
  });

  it('returns a fresh array per call', () => {
    const a = resolveProgressClassList(defaultProgressProps);
    const b = resolveProgressClassList(defaultProgressProps);
    expect(a).not.toBe(b);
  });
});
