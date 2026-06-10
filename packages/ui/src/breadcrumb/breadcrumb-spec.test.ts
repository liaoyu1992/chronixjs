import { describe, expect, it } from 'vitest';

import {
  defaultBreadcrumbProps,
  type BreadcrumbItem,
  type BreadcrumbProps,
} from './breadcrumb-spec.js';

describe('defaultBreadcrumbProps', () => {
  it('matches the documented defaults (empty items, "/" separator)', () => {
    expect(defaultBreadcrumbProps).toEqual({
      items: [],
      separator: '/',
    });
  });

  it('is a BreadcrumbProps-shape that adapters can spread', () => {
    const items: BreadcrumbItem[] = [
      { key: 'home', label: 'Home', href: '/', clickable: false },
      { key: 'docs', label: 'Docs', href: '/docs', clickable: false },
      { key: 'current', label: 'Phase 19', href: undefined, clickable: false },
    ];
    const override: BreadcrumbProps = {
      ...defaultBreadcrumbProps,
      items,
      separator: '>',
    };
    expect(override.items).toHaveLength(3);
    expect(override.separator).toBe('>');
  });
});

describe('BreadcrumbItem shape', () => {
  it('accepts href-only items (linked navigation)', () => {
    const linked: BreadcrumbItem = {
      key: 'home',
      label: 'Home',
      href: '/',
      clickable: false,
    };
    expect(linked.href).toBe('/');
  });

  it('accepts clickable-without-href items (SPA-only navigation)', () => {
    const spa: BreadcrumbItem = {
      key: 'docs',
      label: 'Docs',
      href: undefined,
      clickable: true,
    };
    expect(spa.href).toBeUndefined();
    expect(spa.clickable).toBe(true);
  });

  it('accepts non-clickable trailing items', () => {
    const trailing: BreadcrumbItem = {
      key: 'current',
      label: 'Phase 19',
      href: undefined,
      clickable: false,
    };
    expect(trailing.href).toBeUndefined();
    expect(trailing.clickable).toBe(false);
  });
});
