import { describe, expect, it } from 'vitest';

import { DEFAULT_VIRTUAL_WINDOW_OVERSCAN, computeVirtualWindow } from './compute-virtual-window.js';

describe('computeVirtualWindow — uniform-height fast path', () => {
  it('totalItemCount = 0 returns empty window with zero totalHeightPx', () => {
    const result = computeVirtualWindow({
      totalItemCount: 0,
      itemHeightPx: 20,
      scrollTop: 0,
      viewportHeight: 100,
    });
    expect(result).toEqual({
      startIndex: 0,
      endIndex: 0,
      offsetTopPx: 0,
      totalHeightPx: 0,
    });
  });

  it('itemHeightPx = 0 returns empty window with zero totalHeightPx', () => {
    const result = computeVirtualWindow({
      totalItemCount: 100,
      itemHeightPx: 0,
      scrollTop: 0,
      viewportHeight: 100,
    });
    expect(result).toEqual({
      startIndex: 0,
      endIndex: 0,
      offsetTopPx: 0,
      totalHeightPx: 0,
    });
  });

  it('viewportHeight = 0 returns empty window but still reports totalHeightPx so consumer can reserve scroll height', () => {
    const result = computeVirtualWindow({
      totalItemCount: 100,
      itemHeightPx: 20,
      scrollTop: 0,
      viewportHeight: 0,
    });
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(0);
    expect(result.offsetTopPx).toBe(0);
    expect(result.totalHeightPx).toBe(2000); // pre-mount scrollport can already size its inner layer
  });

  it('scrollTop = 0 + 100 items × 20px + viewport 100px + default overscan = 3 yields visible window [0, 8)', () => {
    const result = computeVirtualWindow({
      totalItemCount: 100,
      itemHeightPx: 20,
      scrollTop: 0,
      viewportHeight: 100,
    });
    expect(result.startIndex).toBe(0);
    // rawStart=0; rawEnd=ceil(100/20)=5; overscan=3 ⇒ endIndex=5+3=8
    expect(result.endIndex).toBe(8);
    expect(result.offsetTopPx).toBe(0);
    expect(result.totalHeightPx).toBe(2000);
  });

  it('scrollTop = 50 + same setup applies overscan + clamps non-negative', () => {
    const result = computeVirtualWindow({
      totalItemCount: 100,
      itemHeightPx: 20,
      scrollTop: 50,
      viewportHeight: 100,
    });
    // rawStart=floor(50/20)=2; rawEnd=ceil(150/20)=8; overscan=3
    // startIndex=max(0, 2-3)=0; endIndex=min(100, 8+3)=11
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(11);
    expect(result.offsetTopPx).toBe(0);
  });

  it('scrollTop = 200 + same setup yields mid-list window with non-zero offsetTopPx', () => {
    const result = computeVirtualWindow({
      totalItemCount: 100,
      itemHeightPx: 20,
      scrollTop: 200,
      viewportHeight: 100,
    });
    // rawStart=floor(200/20)=10; rawEnd=ceil(300/20)=15; overscan=3
    // startIndex=max(0, 10-3)=7; endIndex=min(100, 15+3)=18
    expect(result.startIndex).toBe(7);
    expect(result.endIndex).toBe(18);
    expect(result.offsetTopPx).toBe(7 * 20);
  });

  it('overscan = 0 yields tight visible window without buffer', () => {
    const result = computeVirtualWindow({
      totalItemCount: 100,
      itemHeightPx: 20,
      scrollTop: 200,
      viewportHeight: 100,
      overscan: 0,
    });
    // rawStart=10; rawEnd=15; overscan=0 ⇒ startIndex=10, endIndex=15
    expect(result.startIndex).toBe(10);
    expect(result.endIndex).toBe(15);
    expect(result.offsetTopPx).toBe(200);
  });

  it('overscan = 10 widens window + clamps to totalItemCount', () => {
    const result = computeVirtualWindow({
      totalItemCount: 100,
      itemHeightPx: 20,
      scrollTop: 1700, // near end (totalHeight 2000)
      viewportHeight: 100,
      overscan: 10,
    });
    // rawStart=floor(1700/20)=85; rawEnd=ceil(1800/20)=90; overscan=10
    // startIndex=max(0, 85-10)=75; endIndex=min(100, 90+10)=100 (clamped)
    expect(result.startIndex).toBe(75);
    expect(result.endIndex).toBe(100);
  });

  it('scrollTop beyond total content clamps endIndex to totalItemCount', () => {
    const result = computeVirtualWindow({
      totalItemCount: 100,
      itemHeightPx: 20,
      scrollTop: 5000, // far past totalHeight 2000
      viewportHeight: 100,
    });
    // rawStart=floor(5000/20)=250; rawEnd=ceil(5100/20)=255
    // startIndex=min(totalItemCount, max(0, 250-3))=100; endIndex=min(100, 255+3)=100
    // ⇒ empty window at the bottom — consumer detects startIndex === endIndex
    expect(result.startIndex).toBe(100);
    expect(result.endIndex).toBe(100);
    expect(result.totalHeightPx).toBe(2000);
  });

  it('negative scrollTop (Safari rubber-band bounce) clamps to 0', () => {
    const result = computeVirtualWindow({
      totalItemCount: 100,
      itemHeightPx: 20,
      scrollTop: -50,
      viewportHeight: 100,
    });
    // effectiveScrollTop = max(0, -50) = 0
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(8);
    expect(result.offsetTopPx).toBe(0);
  });

  it('negative itemHeightPx (consumer bug) returns empty window', () => {
    const result = computeVirtualWindow({
      totalItemCount: 100,
      itemHeightPx: -10,
      scrollTop: 0,
      viewportHeight: 100,
    });
    expect(result).toEqual({
      startIndex: 0,
      endIndex: 0,
      offsetTopPx: 0,
      totalHeightPx: 0,
    });
  });

  it('fractional itemHeightPx + integer scrollTop computes floor/ceil correctly without off-by-one', () => {
    const result = computeVirtualWindow({
      totalItemCount: 50,
      itemHeightPx: 28.5,
      scrollTop: 100,
      viewportHeight: 200,
      overscan: 0,
    });
    // rawStart=floor(100/28.5)=floor(3.508)=3
    // rawEnd=ceil(300/28.5)=ceil(10.526)=11
    expect(result.startIndex).toBe(3);
    expect(result.endIndex).toBe(11);
    expect(result.offsetTopPx).toBeCloseTo(3 * 28.5, 5);
    expect(result.totalHeightPx).toBeCloseTo(50 * 28.5, 5);
  });

  it('DEFAULT_VIRTUAL_WINDOW_OVERSCAN constant is 3 (matches chronix-table convention)', () => {
    expect(DEFAULT_VIRTUAL_WINDOW_OVERSCAN).toBe(3);
  });
});
