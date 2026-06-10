import { describe, expect, it } from 'vitest';

import { isBreadcrumbItemClickable } from './is-breadcrumb-item-clickable.js';

import type { BreadcrumbItem } from './breadcrumb-spec.js';

function item(over: Partial<BreadcrumbItem> = {}): BreadcrumbItem {
  return {
    key: 'k',
    label: 'L',
    href: undefined,
    clickable: false,
    ...over,
  };
}

describe('isBreadcrumbItemClickable', () => {
  it('returns true when href is set + clickable is false', () => {
    expect(isBreadcrumbItemClickable(item({ href: '/' }))).toBe(true);
  });

  it('returns true when clickable is true + href is undefined', () => {
    expect(isBreadcrumbItemClickable(item({ clickable: true }))).toBe(true);
  });

  it('returns true when both href and clickable are set', () => {
    expect(isBreadcrumbItemClickable(item({ href: '/', clickable: true }))).toBe(true);
  });

  it('returns false when href is undefined + clickable is false', () => {
    expect(isBreadcrumbItemClickable(item())).toBe(false);
  });

  it('treats empty-string href as a set href (clickable)', () => {
    expect(isBreadcrumbItemClickable(item({ href: '' }))).toBe(true);
  });
});
