import { describe, expect, it } from 'vitest';

import { clampResizeWidth } from './clamp-resize-width.js';

import type { ColumnSpec } from '../ir/index.js';

const bareCol: ColumnSpec = { id: 'a', field: 'a' };
const boundedCol: ColumnSpec = { id: 'b', field: 'b', minWidth: 80, maxWidth: 320 };
const minOnlyCol: ColumnSpec = { id: 'c', field: 'c', minWidth: 100 };
const maxOnlyCol: ColumnSpec = { id: 'd', field: 'd', maxWidth: 200 };
const misconfiguredCol: ColumnSpec = { id: 'e', field: 'e', minWidth: 300, maxWidth: 100 };

describe('clampResizeWidth', () => {
  it('raw within [min, max] returns raw unchanged', () => {
    expect(clampResizeWidth(150, boundedCol, 40)).toBe(150);
    expect(clampResizeWidth(80, boundedCol, 40)).toBe(80);
    expect(clampResizeWidth(320, boundedCol, 40)).toBe(320);
  });

  it('raw below minWidth clamps up to minWidth', () => {
    expect(clampResizeWidth(50, boundedCol, 40)).toBe(80);
    expect(clampResizeWidth(0, minOnlyCol, 40)).toBe(100);
    expect(clampResizeWidth(-10, boundedCol, 40)).toBe(80);
  });

  it('raw above maxWidth clamps down to maxWidth', () => {
    expect(clampResizeWidth(500, boundedCol, 40)).toBe(320);
    expect(clampResizeWidth(1000, maxOnlyCol, 40)).toBe(200);
  });

  it('column without minWidth uses defaultMinColumnWidth', () => {
    expect(clampResizeWidth(20, bareCol, 40)).toBe(40);
    expect(clampResizeWidth(60, bareCol, 40)).toBe(60);
    expect(clampResizeWidth(80, maxOnlyCol, 40)).toBe(80); // minWidth-less column → default 40 floor, raw 80 passes
  });

  it('column without maxWidth has no upper bound (very large raw passes through)', () => {
    expect(clampResizeWidth(99_999, bareCol, 40)).toBe(99_999);
    expect(clampResizeWidth(99_999, minOnlyCol, 40)).toBe(99_999);
  });

  it('non-finite raw (NaN, ±Infinity) returns min defensively', () => {
    expect(clampResizeWidth(Number.NaN, boundedCol, 40)).toBe(80);
    expect(clampResizeWidth(Number.POSITIVE_INFINITY, boundedCol, 40)).toBe(80);
    expect(clampResizeWidth(Number.NEGATIVE_INFINITY, boundedCol, 40)).toBe(80);
    expect(clampResizeWidth(Number.NaN, bareCol, 40)).toBe(40);
  });

  it('misconfigured min > max → min wins (same precedence as columnLayoutPass)', () => {
    // Math.max(min=300, Math.min(max=100, raw=150)) = Math.max(300, 100) = 300.
    expect(clampResizeWidth(150, misconfiguredCol, 40)).toBe(300);
  });
});
