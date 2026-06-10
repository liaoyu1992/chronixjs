import { describe, expect, it } from 'vitest';

import { resolveTagClassList } from './resolve-tag-class-list.js';
import { defaultTagProps } from './tag-spec.js';

describe('resolveTagClassList', () => {
  it('returns base + type + size + bordered for defaults', () => {
    expect(resolveTagClassList(defaultTagProps)).toEqual([
      'cx-ui-tag',
      'cx-ui-tag--default',
      'cx-ui-tag--medium',
      'cx-ui-tag--bordered',
    ]);
  });

  it('reflects the type prop in the BEM modifier', () => {
    for (const t of ['default', 'primary', 'info', 'success', 'warning', 'error'] as const) {
      const classes = resolveTagClassList({ ...defaultTagProps, type: t });
      expect(classes).toContain(`cx-ui-tag--${t}`);
    }
  });

  it('reflects the size prop in the BEM modifier', () => {
    for (const s of ['small', 'medium', 'large'] as const) {
      const classes = resolveTagClassList({ ...defaultTagProps, size: s });
      expect(classes).toContain(`cx-ui-tag--${s}`);
    }
  });

  it('omits --bordered when bordered=false', () => {
    expect(resolveTagClassList({ ...defaultTagProps, bordered: false })).not.toContain(
      'cx-ui-tag--bordered',
    );
  });

  it('adds --round / --closable / --disabled when the corresponding props are true', () => {
    const classes = resolveTagClassList({
      ...defaultTagProps,
      round: true,
      closable: true,
      disabled: true,
    });
    expect(classes).toContain('cx-ui-tag--round');
    expect(classes).toContain('cx-ui-tag--closable');
    expect(classes).toContain('cx-ui-tag--disabled');
  });

  it('returns a fresh array per call (callers may mutate)', () => {
    const a = resolveTagClassList(defaultTagProps);
    const b = resolveTagClassList(defaultTagProps);
    expect(a).not.toBe(b);
    a.push('mutated');
    expect(b).not.toContain('mutated');
  });
});
