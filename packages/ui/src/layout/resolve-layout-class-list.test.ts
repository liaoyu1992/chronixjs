import { describe, expect, it } from 'vitest';

import {
  resolveLayoutClassList,
  resolveLayoutContentClassList,
  resolveLayoutFooterClassList,
  resolveLayoutHeaderClassList,
  resolveLayoutSiderClassList,
} from './resolve-layout-class-list.js';

describe('resolveLayoutClassList', () => {
  it('returns base when no sider + static position', () => {
    expect(resolveLayoutClassList({ hasSider: false, position: 'static' })).toEqual([
      'cx-ui-layout',
    ]);
  });

  it('adds --has-sider modifier when hasSider=true', () => {
    expect(resolveLayoutClassList({ hasSider: true, position: 'static' })).toContain(
      'cx-ui-layout--has-sider',
    );
  });

  it('adds --position-absolute modifier when position=absolute', () => {
    expect(resolveLayoutClassList({ hasSider: false, position: 'absolute' })).toContain(
      'cx-ui-layout--position-absolute',
    );
  });
});

describe('resolveLayoutSiderClassList', () => {
  it('returns base + placement modifier when not collapsed/collapsible', () => {
    expect(
      resolveLayoutSiderClassList({ collapsed: false, collapsible: false, placement: 'left' }),
    ).toEqual(['cx-ui-layout__sider', 'cx-ui-layout__sider--placement-left']);
  });

  it('adds --collapsed when collapsed=true', () => {
    expect(
      resolveLayoutSiderClassList({ collapsed: true, collapsible: false, placement: 'right' }),
    ).toContain('cx-ui-layout__sider--collapsed');
  });

  it('adds --collapsible when collapsible=true', () => {
    expect(
      resolveLayoutSiderClassList({ collapsed: false, collapsible: true, placement: 'left' }),
    ).toContain('cx-ui-layout__sider--collapsible');
  });
});

describe('sub-component class lists', () => {
  it('header returns single root class', () => {
    expect(resolveLayoutHeaderClassList()).toEqual(['cx-ui-layout__header']);
  });
  it('content returns single root class', () => {
    expect(resolveLayoutContentClassList()).toEqual(['cx-ui-layout__content']);
  });
  it('footer returns single root class', () => {
    expect(resolveLayoutFooterClassList()).toEqual(['cx-ui-layout__footer']);
  });
});
