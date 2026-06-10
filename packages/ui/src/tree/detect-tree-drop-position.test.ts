import { describe, expect, it } from 'vitest';

import { detectTreeDropPosition } from './detect-tree-drop-position.js';

describe('detectTreeDropPosition', () => {
  it('pointerY=0, rowHeight=28 => before', () => {
    expect(detectTreeDropPosition({ pointerYInRow: 0, rowHeight: 28 })).toBe('before');
  });

  it('pointerY=14, rowHeight=28 => inside', () => {
    expect(detectTreeDropPosition({ pointerYInRow: 14, rowHeight: 28 })).toBe('inside');
  });

  it('pointerY=27, rowHeight=28 => after', () => {
    expect(detectTreeDropPosition({ pointerYInRow: 27, rowHeight: 28 })).toBe('after');
  });

  it('edge: pointerY=7 (25% boundary) => inside', () => {
    // 7/28 = 0.25, which is NOT < 0.25, so falls through to 'inside' or 'after'
    expect(detectTreeDropPosition({ pointerYInRow: 7, rowHeight: 28 })).toBe('inside');
  });

  it('edge: pointerY=6 (< 25%) => before', () => {
    // 6/28 = 0.214... < 0.25
    expect(detectTreeDropPosition({ pointerYInRow: 6, rowHeight: 28 })).toBe('before');
  });
});
