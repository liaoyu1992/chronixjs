import { describe, expect, it } from 'vitest';

import {
  LAYOUT_SIDER_BREAKPOINT_PX,
  defaultLayoutProps,
  defaultLayoutSiderProps,
  resolveBreakpointMediaQuery,
  resolveLayoutSiderWidthStyle,
} from './layout-spec.js';

describe('defaultLayoutProps', () => {
  it('matches defaults (no sider, static positioning)', () => {
    expect(defaultLayoutProps).toEqual({ hasSider: false, position: 'static' });
  });
});

describe('defaultLayoutSiderProps', () => {
  it('matches defaults (200/48 widths, left, no breakpoint)', () => {
    expect(defaultLayoutSiderProps).toEqual({
      width: 200,
      collapsedWidth: 48,
      collapsed: false,
      collapsible: false,
      placement: 'left',
      breakpoint: undefined,
    });
  });
});

describe('resolveLayoutSiderWidthStyle', () => {
  it('returns expanded px width when not collapsed (number)', () => {
    expect(resolveLayoutSiderWidthStyle({ collapsed: false, width: 240, collapsedWidth: 64 })).toBe(
      '240px',
    );
  });

  it('returns collapsed px width when collapsed (number)', () => {
    expect(resolveLayoutSiderWidthStyle({ collapsed: true, width: 240, collapsedWidth: 64 })).toBe(
      '64px',
    );
  });

  it('passes through string widths verbatim', () => {
    expect(
      resolveLayoutSiderWidthStyle({ collapsed: false, width: '20rem', collapsedWidth: '4rem' }),
    ).toBe('20rem');
    expect(
      resolveLayoutSiderWidthStyle({ collapsed: true, width: '20rem', collapsedWidth: '4rem' }),
    ).toBe('4rem');
  });
});

describe('LAYOUT_SIDER_BREAKPOINT_PX + resolveBreakpointMediaQuery', () => {
  it('has the canonical 5 breakpoint values', () => {
    expect(LAYOUT_SIDER_BREAKPOINT_PX).toEqual({
      xs: 576,
      sm: 768,
      md: 992,
      lg: 1200,
      xl: 1600,
    });
  });

  it('builds a max-width media query one px below the breakpoint', () => {
    expect(resolveBreakpointMediaQuery('md')).toBe('(max-width: 991px)');
    expect(resolveBreakpointMediaQuery('xl')).toBe('(max-width: 1599px)');
  });
});
