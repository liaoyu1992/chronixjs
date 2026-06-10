import { describe, expect, it } from 'vitest';

import { defaultBreadcrumbProps } from './breadcrumb-spec.js';
import { resolveBreadcrumbClassList } from './resolve-breadcrumb-class-list.js';

describe('resolveBreadcrumbClassList', () => {
  it('returns just the base class for default props', () => {
    expect(resolveBreadcrumbClassList(defaultBreadcrumbProps, false)).toEqual(['cx-ui-breadcrumb']);
  });

  it('adds --custom-separator when separator is non-default and no slot supplied', () => {
    const classes = resolveBreadcrumbClassList(
      { ...defaultBreadcrumbProps, separator: '>' },
      false,
    );
    expect(classes).toContain('cx-ui-breadcrumb--custom-separator');
  });

  it('omits --custom-separator when separator is the default "/"', () => {
    const classes = resolveBreadcrumbClassList(defaultBreadcrumbProps, false);
    expect(classes).not.toContain('cx-ui-breadcrumb--custom-separator');
  });

  it('omits --custom-separator when a separator slot is supplied (slot wins)', () => {
    const classes = resolveBreadcrumbClassList({ ...defaultBreadcrumbProps, separator: '>' }, true);
    expect(classes).not.toContain('cx-ui-breadcrumb--custom-separator');
  });

  it('returns a fresh array per call', () => {
    const a = resolveBreadcrumbClassList(defaultBreadcrumbProps, false);
    const b = resolveBreadcrumbClassList(defaultBreadcrumbProps, false);
    expect(a).not.toBe(b);
  });
});
