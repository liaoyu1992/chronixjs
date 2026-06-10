import { describe, expect, it } from 'vitest';

import { defaultStatusBarText } from './default-status-bar-text.js';

describe('defaultStatusBarText', () => {
  it('renders just total when nothing selected + no filter', () => {
    const out = defaultStatusBarText({
      total: 50,
      filtered: 50,
      selected: 0,
      page: 0,
      pageSize: 0,
    });
    expect(out).toBe('50 行');
  });

  it('includes selected segment when selected > 0', () => {
    const out = defaultStatusBarText({
      total: 50,
      filtered: 50,
      selected: 3,
      page: 0,
      pageSize: 0,
    });
    expect(out).toBe('50 行 · 已选 3');
  });

  it('includes filtered segment when filtered != total', () => {
    const out = defaultStatusBarText({
      total: 50,
      filtered: 12,
      selected: 0,
      page: 0,
      pageSize: 0,
    });
    expect(out).toBe('50 行 · 过滤后 12');
  });

  it('shows both selected + filtered segments when both active', () => {
    const out = defaultStatusBarText({
      total: 50,
      filtered: 12,
      selected: 3,
      page: 0,
      pageSize: 0,
    });
    expect(out).toBe('50 行 · 已选 3 · 过滤后 12');
  });

  it('handles zero-row case', () => {
    const out = defaultStatusBarText({
      total: 0,
      filtered: 0,
      selected: 0,
      page: 0,
      pageSize: 0,
    });
    expect(out).toBe('0 行');
  });

  it('ignores page + pageSize (not part of the default text)', () => {
    const out = defaultStatusBarText({
      total: 50,
      filtered: 50,
      selected: 0,
      page: 2,
      pageSize: 20,
    });
    expect(out).toBe('50 行');
  });
});
