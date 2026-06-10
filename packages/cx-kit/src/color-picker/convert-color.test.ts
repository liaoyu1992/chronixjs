import { describe, expect, it } from 'vitest';

import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from './convert-color.js';

describe('rgbToHsv — Phase 99', () => {
  it('pure red → h=0 s=1 v=1', () => {
    expect(rgbToHsv({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 1, v: 1 });
  });

  it('pure green → h=120 s=1 v=1', () => {
    expect(rgbToHsv({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 1, v: 1 });
  });

  it('pure blue → h=240 s=1 v=1', () => {
    expect(rgbToHsv({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 1, v: 1 });
  });

  it('black → h=0 s=0 v=0', () => {
    expect(rgbToHsv({ r: 0, g: 0, b: 0 })).toEqual({ h: 0, s: 0, v: 0 });
  });

  it('white → h=0 s=0 v=1', () => {
    expect(rgbToHsv({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, v: 1 });
  });

  it('mid gray (max === min) → s=0 (grayscale)', () => {
    const result = rgbToHsv({ r: 128, g: 128, b: 128 });
    expect(result.s).toBe(0);
    expect(result.h).toBe(0);
    expect(result.v).toBeCloseTo(128 / 255, 5);
  });

  it('orange (255, 165, 0) → h≈38.8', () => {
    const result = rgbToHsv({ r: 255, g: 165, b: 0 });
    expect(result.h).toBeCloseTo(38.82, 1);
    expect(result.s).toBe(1);
    expect(result.v).toBe(1);
  });
});

describe('hsvToRgb — Phase 99', () => {
  it('hue=0 s=1 v=1 → pure red', () => {
    expect(hsvToRgb({ h: 0, s: 1, v: 1 })).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('hue=60 s=1 v=1 → pure yellow', () => {
    expect(hsvToRgb({ h: 60, s: 1, v: 1 })).toEqual({ r: 255, g: 255, b: 0 });
  });

  it('hue=120 s=1 v=1 → pure green', () => {
    expect(hsvToRgb({ h: 120, s: 1, v: 1 })).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('hue=180 s=1 v=1 → pure cyan', () => {
    expect(hsvToRgb({ h: 180, s: 1, v: 1 })).toEqual({ r: 0, g: 255, b: 255 });
  });

  it('hue=240 s=1 v=1 → pure blue', () => {
    expect(hsvToRgb({ h: 240, s: 1, v: 1 })).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('hue=300 s=1 v=1 → pure magenta', () => {
    expect(hsvToRgb({ h: 300, s: 1, v: 1 })).toEqual({ r: 255, g: 0, b: 255 });
  });

  it('s=0 (regardless of hue) → grayscale at value brightness', () => {
    expect(hsvToRgb({ h: 200, s: 0, v: 0.5 })).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('v=0 (regardless of hue + saturation) → black', () => {
    expect(hsvToRgb({ h: 200, s: 1, v: 0 })).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('hue wraps via modulo (hue=420 = 60)', () => {
    expect(hsvToRgb({ h: 420, s: 1, v: 1 })).toEqual({ r: 255, g: 255, b: 0 });
  });

  it('negative hue wraps positive', () => {
    expect(hsvToRgb({ h: -60, s: 1, v: 1 })).toEqual({ r: 255, g: 0, b: 255 });
  });
});

describe('rgbToHex — Phase 99', () => {
  it('pure red → #ff0000', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
  });

  it('pure black → #000000', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });

  it('pure white → #ffffff', () => {
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
  });

  it('clamps channels above 255', () => {
    expect(rgbToHex({ r: 300, g: 0, b: 0 })).toBe('#ff0000');
  });

  it('clamps channels below 0', () => {
    expect(rgbToHex({ r: -10, g: 128, b: 0 })).toBe('#008000');
  });

  it('rounds fractional channels', () => {
    expect(rgbToHex({ r: 127.6, g: 0, b: 0 })).toBe('#800000');
  });

  it('emits 7-char lowercase format', () => {
    const hex = rgbToHex({ r: 171, g: 205, b: 239 });
    expect(hex).toBe('#abcdef');
    expect(hex.length).toBe(7);
    expect(hex).toBe(hex.toLowerCase());
  });
});

describe('hexToRgb — Phase 99', () => {
  it('parses 6-char #rrggbb', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses 3-char #rgb (expanded by repeating)', () => {
    expect(hexToRgb('#f0a')).toEqual({ r: 255, g: 0, b: 170 });
  });

  it('accepts uppercase', () => {
    expect(hexToRgb('#FF8800')).toEqual({ r: 255, g: 136, b: 0 });
  });

  it('accepts mixed case', () => {
    expect(hexToRgb('#aB12cD')).toEqual({ r: 171, g: 18, b: 205 });
  });

  it('returns null on missing # prefix', () => {
    expect(hexToRgb('ff0000')).toBeNull();
  });

  it('returns null on wrong length', () => {
    expect(hexToRgb('#ff00')).toBeNull();
    expect(hexToRgb('#ff00000')).toBeNull();
  });

  it('returns null on non-hex characters', () => {
    expect(hexToRgb('#xyz123')).toBeNull();
  });

  it('returns null on empty string', () => {
    expect(hexToRgb('')).toBeNull();
  });

  it('round-trips through HEX → RGB → HSV → RGB → HEX', () => {
    const original = '#abcdef';
    const rgb = hexToRgb(original);
    expect(rgb).not.toBeNull();
    const hsv = rgbToHsv(rgb!);
    const rgbAgain = hsvToRgb(hsv);
    const hexAgain = rgbToHex(rgbAgain);
    expect(hexAgain).toBe(original);
  });
});
