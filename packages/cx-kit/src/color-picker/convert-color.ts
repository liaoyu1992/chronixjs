/**
 * RGB color value. Integer channels in the inclusive range `[0, 255]`.
 * Out-of-range channels are clamped + rounded by `rgbToHex`. Other
 * helpers assume the contract is upheld.
 */
export interface Rgb {
  /** Red channel (0-255 integer). */
  readonly r: number;
  /** Green channel (0-255 integer). */
  readonly g: number;
  /** Blue channel (0-255 integer). */
  readonly b: number;
}

/**
 * HSV color value. Hue in degrees `[0, 360)`; saturation + value in
 * unit interval `[0, 1]`.
 *
 * - Hue 0 / 360 = pure red; 120 = pure green; 240 = pure blue.
 * - Saturation 0 ⇒ grayscale (regardless of hue); 1 ⇒ fully saturated.
 * - Value 0 ⇒ black (regardless of hue + saturation); 1 ⇒ max brightness.
 */
export interface Hsv {
  /** Hue in degrees (0-360 exclusive; wraps at 360). */
  readonly h: number;
  /** Saturation (0-1 inclusive). */
  readonly s: number;
  /** Value / brightness (0-1 inclusive). */
  readonly v: number;
}

function clamp(value: number, lo: number, hi: number): number {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

function clampChannel(channel: number): number {
  return clamp(Math.round(channel), 0, 255);
}

/**
 * Convert RGB to HSV using the canonical algorithm:
 *
 * 1. Normalize channels to `[0, 1]`.
 * 2. Find max + min normalized channels.
 * 3. Value `v = max`; saturation `s = max === 0 ? 0 : (max - min) / max`.
 * 4. Hue derives from which channel is dominant + the difference of
 *    the other two channels. Grayscale (max === min) ⇒ hue = 0.
 *
 * Returned hue is in `[0, 360)` — exactly 360 wraps to 0.
 */
export function rgbToHsv(rgb: Rgb): Hsv {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const v = max;
  const s = max === 0 ? 0 : delta / max;
  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
    if (h >= 360) h -= 360;
  }
  return { h, s, v };
}

/**
 * Convert HSV to RGB using the canonical 6-sector algorithm:
 *
 * 1. Normalize hue to `[0, 360)` and divide into 6 sectors of 60°.
 * 2. Compute chroma `c = v * s`; secondary `x = c * (1 - |((h/60) %
 *    2) - 1|)`; offset `m = v - c`.
 * 3. Sector index 0-5 picks `(r', g', b')` permutation of
 *    `(c, x, 0)`.
 * 4. Add offset `m` to each component; scale to `[0, 255]`; round.
 *
 * Out-of-range HSV input clamps internally (s/v to `[0, 1]`; hue
 * wraps via modulo).
 */
export function hsvToRgb(hsv: Hsv): Rgb {
  const s = clamp(hsv.s, 0, 1);
  const v = clamp(hsv.v, 0, 1);
  let h = hsv.h % 360;
  if (h < 0) h += 360;
  const c = v * s;
  const hPrime = h / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hPrime < 1) {
    r = c;
    g = x;
  } else if (hPrime < 2) {
    r = x;
    g = c;
  } else if (hPrime < 3) {
    g = c;
    b = x;
  } else if (hPrime < 4) {
    g = x;
    b = c;
  } else if (hPrime < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return {
    r: clampChannel((r + m) * 255),
    g: clampChannel((g + m) * 255),
    b: clampChannel((b + m) * 255),
  };
}

/**
 * Emit a 7-character lowercase `#rrggbb` HEX string. Channels are
 * clamped to `[0, 255]` and rounded to integer before emission.
 */
export function rgbToHex(rgb: Rgb): string {
  const r = clampChannel(rgb.r);
  const g = clampChannel(rgb.g);
  const b = clampChannel(rgb.b);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const HEX_3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX_6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

/**
 * Parse a HEX color string into RGB. Accepts:
 *
 * - 7-char form `#rrggbb` (case-insensitive).
 * - 4-char form `#rgb` (case-insensitive), expanded by repeating each
 *   nibble: `#abc` → `#aabbcc`.
 *
 * Returns `null` for any invalid input (missing `#`, wrong length,
 * non-hex characters). Consumers handle `null` per their UX policy
 * (e.g. preserve prior color, show validation error).
 */
export function hexToRgb(hex: string): Rgb | null {
  const m6 = HEX_6.exec(hex);
  if (m6 != null) {
    return {
      r: parseInt(m6[1]!, 16),
      g: parseInt(m6[2]!, 16),
      b: parseInt(m6[3]!, 16),
    };
  }
  const m3 = HEX_3.exec(hex);
  if (m3 != null) {
    return {
      r: parseInt(m3[1]! + m3[1]!, 16),
      g: parseInt(m3[2]! + m3[2]!, 16),
      b: parseInt(m3[3]! + m3[3]!, 16),
    };
  }
  return null;
}
