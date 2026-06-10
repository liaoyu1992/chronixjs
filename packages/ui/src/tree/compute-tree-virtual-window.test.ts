import { describe, expect, it } from 'vitest';

import { computeTreeVirtualWindow } from './compute-tree-virtual-window.js';

describe('computeTreeVirtualWindow', () => {
  it('returns empty window when visibleRowCount=0', () => {
    const result = computeTreeVirtualWindow({
      visibleRowCount: 0,
      itemHeightPx: 28,
      scrollTop: 0,
      viewportHeight: 200,
    });
    expect(result).toEqual({ startIndex: 0, endIndex: 0, offsetTopPx: 0, totalHeightPx: 0 });
  });

  it('computes correct start/end/offset/total at scrollTop=0', () => {
    const result = computeTreeVirtualWindow({
      visibleRowCount: 100,
      itemHeightPx: 28,
      scrollTop: 0,
      viewportHeight: 200,
    });
    // rawStart=0, rawEnd=ceil(200/28)=8, overscan=3 => startIndex=max(0,0-3)=0, endIndex=max(0,min(100,8+3))=11
    // totalHeightPx = 100*28 = 2800, offsetTopPx = 0*28 = 0
    expect(result.totalHeightPx).toBe(2800);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(11);
    expect(result.offsetTopPx).toBe(0);
  });

  it('computes correct window when scrollTop is in the middle', () => {
    const result = computeTreeVirtualWindow({
      visibleRowCount: 100,
      itemHeightPx: 28,
      scrollTop: 1400,
      viewportHeight: 200,
    });
    // rawStart=floor(1400/28)=50, rawEnd=ceil((1400+200)/28)=ceil(1600/28)=ceil(57.14)=58
    // overscan=3 => startIndex=max(0,50-3)=47, endIndex=max(47,min(100,58+3))=61
    // offsetTopPx = 47*28 = 1316
    expect(result.startIndex).toBe(47);
    expect(result.endIndex).toBe(61);
    expect(result.offsetTopPx).toBe(1316);
    expect(result.totalHeightPx).toBe(2800);
  });

  it('applies custom overscan', () => {
    const result = computeTreeVirtualWindow({
      visibleRowCount: 100,
      itemHeightPx: 28,
      scrollTop: 0,
      viewportHeight: 200,
      overscan: 5,
    });
    // rawStart=0, rawEnd=8, overscan=5 => startIndex=0, endIndex=min(100,13)=13
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(13);
  });
});
