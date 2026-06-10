import { describe, expect, it } from 'vitest';

import { computeAutosizeWidth } from './compute-autosize-width.js';

describe('computeAutosizeWidth', () => {
  it('returns max(body) + padding when body cells are widest', () => {
    // body widths: [40, 80, 60] → max 80; header 30; paddingX 16.
    // raw = max(80, 30) + 16 = 96. min 40, no max → 96.
    expect(
      computeAutosizeWidth([40, 80, 60], { paddingX: 16, minWidth: 40, headerWidth: 30 }),
    ).toBe(96);
  });

  it('returns max(header) + padding when header is wider than body cells', () => {
    // body widths: [10, 12]; header 90; paddingX 16.
    // raw = max(12, 90) + 16 = 106. min 40 → 106.
    expect(computeAutosizeWidth([10, 12], { paddingX: 16, minWidth: 40, headerWidth: 90 })).toBe(
      106,
    );
  });

  it('clamps above maxWidth', () => {
    // raw = max(200, 50) + 16 = 216, but maxWidth 180 → 180.
    expect(
      computeAutosizeWidth([200], { paddingX: 16, minWidth: 40, maxWidth: 180, headerWidth: 50 }),
    ).toBe(180);
  });

  it('clamps below minWidth', () => {
    // raw = max(10, 5) + 8 = 18, but minWidth 60 → 60.
    expect(computeAutosizeWidth([10], { paddingX: 8, minWidth: 60, headerWidth: 5 })).toBe(60);
  });

  it('treats no-header (undefined headerWidth) as 0-wide header', () => {
    // body widths: [50, 70]; no header. raw = 70 + 16 = 86. min 40 → 86.
    expect(computeAutosizeWidth([50, 70], { paddingX: 16, minWidth: 40 })).toBe(86);
  });

  it('returns minWidth for fully empty input (no body + no header)', () => {
    // Empty measurements + no header → contentMax 0; raw 0 + 16 = 16;
    // clamp to min 40 → 40. Degenerate-input branch.
    expect(computeAutosizeWidth([], { paddingX: 16, minWidth: 40 })).toBe(40);
  });
});
