import { describe, expect, it } from 'vitest';

import { resolveDescriptionItemSpanStyle } from './resolve-description-item-span-style.js';

import type { DescriptionItem } from './descriptions-spec.js';

function item(over: Partial<DescriptionItem> = {}): DescriptionItem {
  return {
    key: 'k',
    label: 'L',
    value: 'V',
    span: 1,
    ...over,
  };
}

describe('resolveDescriptionItemSpanStyle', () => {
  it('returns undefined for span=1 (CSS default applies)', () => {
    expect(resolveDescriptionItemSpanStyle(item({ span: 1 }), 3)).toBeUndefined();
  });

  it('returns { gridColumn: "span 2" } for span=2 within 3 columns', () => {
    expect(resolveDescriptionItemSpanStyle(item({ span: 2 }), 3)).toEqual({
      gridColumn: 'span 2',
    });
  });

  it('returns { gridColumn: "span 3" } for span=3 within 3 columns', () => {
    expect(resolveDescriptionItemSpanStyle(item({ span: 3 }), 3)).toEqual({
      gridColumn: 'span 3',
    });
  });

  it('returns undefined when span > columns (non-meaningful overflow)', () => {
    expect(resolveDescriptionItemSpanStyle(item({ span: 4 }), 3)).toBeUndefined();
    expect(resolveDescriptionItemSpanStyle(item({ span: 99 }), 3)).toBeUndefined();
  });

  it('returns undefined for span=0 or negative (CSS default applies)', () => {
    expect(resolveDescriptionItemSpanStyle(item({ span: 0 }), 3)).toBeUndefined();
    expect(resolveDescriptionItemSpanStyle(item({ span: -1 }), 3)).toBeUndefined();
  });

  it('handles 12-column grid spans correctly', () => {
    expect(resolveDescriptionItemSpanStyle(item({ span: 6 }), 12)).toEqual({
      gridColumn: 'span 6',
    });
    expect(resolveDescriptionItemSpanStyle(item({ span: 12 }), 12)).toEqual({
      gridColumn: 'span 12',
    });
    expect(resolveDescriptionItemSpanStyle(item({ span: 13 }), 12)).toBeUndefined();
  });

  it('returns a fresh object per call for spanning items', () => {
    const a = resolveDescriptionItemSpanStyle(item({ span: 2 }), 3);
    const b = resolveDescriptionItemSpanStyle(item({ span: 2 }), 3);
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});
