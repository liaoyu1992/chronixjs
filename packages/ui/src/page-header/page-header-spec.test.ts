import { describe, expect, it } from 'vitest';

import {
  PAGE_HEADER_BACK_ICON_PLACEHOLDER,
  defaultPageHeaderProps,
  type PageHeaderProps,
} from './page-header-spec.js';

describe('defaultPageHeaderProps', () => {
  it('matches the documented defaults (no title, no subtitle, no back, light)', () => {
    expect(defaultPageHeaderProps).toEqual({
      title: undefined,
      subtitle: undefined,
      back: false,
      inverted: false,
    });
  });

  it('is a PageHeaderProps-shape that adapters can spread', () => {
    const override: PageHeaderProps = {
      ...defaultPageHeaderProps,
      title: 'Project A',
      subtitle: 'Owned by you',
      back: true,
    };
    expect(override.title).toBe('Project A');
    expect(override.subtitle).toBe('Owned by you');
    expect(override.back).toBe(true);
    expect(override.inverted).toBe(false);
  });
});

describe('PAGE_HEADER_BACK_ICON_PLACEHOLDER', () => {
  it('exports the unicode left-arrow placeholder for the back affordance', () => {
    expect(PAGE_HEADER_BACK_ICON_PLACEHOLDER).toBe('←');
  });

  it('is a single visible character (icon registry will swap in SVG later)', () => {
    expect(typeof PAGE_HEADER_BACK_ICON_PLACEHOLDER).toBe('string');
    expect(PAGE_HEADER_BACK_ICON_PLACEHOLDER.length).toBe(1);
  });
});
