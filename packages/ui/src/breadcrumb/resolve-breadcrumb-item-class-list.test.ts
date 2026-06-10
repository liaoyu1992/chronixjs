import { describe, expect, it } from 'vitest';

import { resolveBreadcrumbItemClassList } from './resolve-breadcrumb-item-class-list.js';

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

describe('resolveBreadcrumbItemClassList', () => {
  it('returns just the base class for a non-clickable non-last item', () => {
    expect(resolveBreadcrumbItemClassList(item(), false)).toEqual(['cx-ui-breadcrumb__item']);
  });

  it('adds --current when isLast is true', () => {
    expect(resolveBreadcrumbItemClassList(item(), true)).toContain(
      'cx-ui-breadcrumb__item--current',
    );
  });

  it('adds --clickable when item has href', () => {
    const classes = resolveBreadcrumbItemClassList(item({ href: '/docs' }), false);
    expect(classes).toContain('cx-ui-breadcrumb__item--clickable');
  });

  it('adds --clickable when item has clickable: true (no href)', () => {
    const classes = resolveBreadcrumbItemClassList(item({ clickable: true }), false);
    expect(classes).toContain('cx-ui-breadcrumb__item--clickable');
  });

  it('combines --current + --clickable when both apply (last + linked)', () => {
    const classes = resolveBreadcrumbItemClassList(item({ href: '/' }), true);
    expect(classes).toContain('cx-ui-breadcrumb__item--current');
    expect(classes).toContain('cx-ui-breadcrumb__item--clickable');
  });

  it('returns a fresh array per call', () => {
    const a = resolveBreadcrumbItemClassList(item(), false);
    const b = resolveBreadcrumbItemClassList(item(), false);
    expect(a).not.toBe(b);
  });
});
