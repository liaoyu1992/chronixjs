import { describe, expect, it } from 'vitest';

import { defaultAffixProps, resolveAffixState } from './affix-spec.js';

describe('defaultAffixProps', () => {
  it('matches defaults (no top, no bottom — never affixes)', () => {
    expect(defaultAffixProps).toEqual({ top: undefined, bottom: undefined });
  });
});

describe('resolveAffixState', () => {
  const placeholder = { top: 50, bottom: 100, left: 20, width: 200 };

  it('affixes to top when top is defined and placeholder.top < top', () => {
    const r = resolveAffixState({
      top: 100,
      bottom: undefined,
      placeholderRect: placeholder,
      viewportHeight: 1000,
    });
    expect(r.affixed).toBe(true);
    expect(r.inlineStyle).toEqual({
      position: 'fixed',
      top: '100px',
      left: '20px',
      width: '200px',
    });
  });

  it('does not affix to top when placeholder.top >= top', () => {
    const r = resolveAffixState({
      top: 10,
      bottom: undefined,
      placeholderRect: placeholder,
      viewportHeight: 1000,
    });
    expect(r.affixed).toBe(false);
    expect(r.inlineStyle).toEqual({});
  });

  it('affixes to bottom when placeholder.bottom > viewportHeight - bottom', () => {
    const r = resolveAffixState({
      top: undefined,
      bottom: 50,
      placeholderRect: { top: 900, bottom: 970, left: 0, width: 100 },
      viewportHeight: 1000,
    });
    expect(r.affixed).toBe(true);
    expect(r.inlineStyle).toEqual({
      position: 'fixed',
      bottom: '50px',
      left: '0px',
      width: '100px',
    });
  });

  it('does not affix when neither top nor bottom is defined', () => {
    const r = resolveAffixState({
      top: undefined,
      bottom: undefined,
      placeholderRect: placeholder,
      viewportHeight: 1000,
    });
    expect(r.affixed).toBe(false);
  });

  it('top takes precedence over bottom when both could fire', () => {
    // placeholder above both thresholds (top scroll past + bottom near edge)
    const r = resolveAffixState({
      top: 100,
      bottom: 50,
      placeholderRect: { top: 50, bottom: 970, left: 0, width: 100 },
      viewportHeight: 1000,
    });
    expect(r.affixed).toBe(true);
    expect(r.inlineStyle['top']).toBe('100px');
    expect(r.inlineStyle['bottom']).toBeUndefined();
  });
});
