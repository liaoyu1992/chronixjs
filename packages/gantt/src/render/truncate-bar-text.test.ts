import { describe, expect, it } from 'vitest';

import { truncateBarText } from './truncate-bar-text.js';

describe('truncateBarText — Phase 28.2 / Phase 32.6', () => {
  it('returns the unmodified string when it already fits in the width budget', () => {
    // fontSize 12 → avgCharWidth 7.2 → maxChars = floor(72 / 7.2) = 10.
    // 'short' (5 chars) <= 10 → no truncation.
    expect(truncateBarText('short', 72, 12)).toBe('short');
  });

  it('returns the unmodified string at the exact fit boundary', () => {
    // 'tenchar!!!' (10 chars) at maxChars=10 → text.length <= maxChars → verbatim.
    expect(truncateBarText('tenchar!!!', 72, 12)).toBe('tenchar!!!');
  });

  it('truncates with `...` ellipsis when the text overflows the width budget', () => {
    // fontSize 12 → avgCharWidth 7.2 → maxChars = floor(72 / 7.2) = 10.
    // 'overflow long text' (18 chars) → slice(0, 10 - 3) + '...' = 'overflo' (7 chars) + '...'.
    expect(truncateBarText('overflow long text', 72, 12)).toBe('overflo...');
  });

  it('returns empty string when maxChars <= 3 cutoff applies (extremely narrow bar)', () => {
    // maxWidth=20 + fontSize=12 → avgCharWidth=7.2 → maxChars = floor(20 / 7.2) = 2.
    // 2 <= 3 → cutoff → empty string. Prevents '.' or '..' fragments from rendering.
    expect(truncateBarText('any long text', 20, 12)).toBe('');
  });

  it('returns empty string at exact maxChars === 3 cutoff boundary', () => {
    // maxWidth=22 + fontSize=12 → avgCharWidth=7.2 → maxChars = floor(22 / 7.2) = 3.
    // 3 <= 3 → cutoff → empty string. The strict `<= 3` gate excludes maxChars=3.
    expect(truncateBarText('any long text', 22, 12)).toBe('');
  });

  it('handles non-Latin characters identically (char-count not byte-count)', () => {
    // fontSize=12 → maxChars=10. '中文标题需要超长一些' (10 chinese chars) <= 10 → verbatim.
    // '中文标题需要超长一些好几个字' (14 chars) overflows → slice(0, 7) + '...'.
    expect(truncateBarText('中文标题需要超长一些', 72, 12)).toBe('中文标题需要超长一些');
    expect(truncateBarText('中文标题需要超长一些好几个字', 72, 12)).toBe('中文标题需要超...');
  });

  it('fontSize drives avgCharWidth so larger font cuts more aggressively at same maxWidth', () => {
    // maxWidth=72 fixed.
    // fontSize=12 → avgCharWidth=7.2 → maxChars=10.
    // fontSize=24 → avgCharWidth=14.4 → maxChars = floor(72 / 14.4) = 5 → still > 3.
    // Truncation: slice(0, 5 - 3) + '...' = 'ov' + '...' = 'ov...'.
    expect(truncateBarText('overflow long text', 72, 24)).toBe('ov...');
  });
});
