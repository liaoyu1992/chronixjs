import { describe, expect, it } from 'vitest';

import { defaultStatusBarText } from './default-status-bar-text.js';

describe('defaultStatusBarText', () => {
  it('renders all three segments with zero selection + no filter', () => {
    const out = defaultStatusBarText({
      total: 50,
      filtered: 50,
      selected: 0,
      page: 0,
      pageSize: 0,
    });
    expect(out).toBe('共 50 行，已选 0 行，筛选 50 行');
  });

  it('reflects selected count in the 已选 segment', () => {
    const out = defaultStatusBarText({
      total: 50,
      filtered: 50,
      selected: 3,
      page: 0,
      pageSize: 0,
    });
    expect(out).toBe('共 50 行，已选 3 行，筛选 50 行');
  });

  it('reflects filtered count in the 筛选 segment', () => {
    const out = defaultStatusBarText({
      total: 50,
      filtered: 12,
      selected: 0,
      page: 0,
      pageSize: 0,
    });
    expect(out).toBe('共 50 行，已选 0 行，筛选 12 行');
  });

  it('shows all three segments populated', () => {
    const out = defaultStatusBarText({
      total: 50,
      filtered: 12,
      selected: 3,
      page: 0,
      pageSize: 0,
    });
    expect(out).toBe('共 50 行，已选 3 行，筛选 12 行');
  });

  it('handles zero-row case', () => {
    const out = defaultStatusBarText({
      total: 0,
      filtered: 0,
      selected: 0,
      page: 0,
      pageSize: 0,
    });
    expect(out).toBe('共 0 行，已选 0 行，筛选 0 行');
  });

  it('ignores page + pageSize (not part of the default text)', () => {
    const out = defaultStatusBarText({
      total: 50,
      filtered: 50,
      selected: 0,
      page: 2,
      pageSize: 20,
    });
    expect(out).toBe('共 50 行，已选 0 行，筛选 50 行');
  });
});
