// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_DRAWER_CSS, ensureChronixDrawerStyles } from './drawer-styles.js';

describe('CHRONIX_DRAWER_CSS', () => {
  it('declares wrapper + mask + panel + 4 placement modifiers + header/body/footer', () => {
    expect(CHRONIX_DRAWER_CSS).toContain('.cx-ui-drawer-wrapper');
    expect(CHRONIX_DRAWER_CSS).toContain('.cx-ui-drawer__mask');
    expect(CHRONIX_DRAWER_CSS).toContain('.cx-ui-drawer--placement-left');
    expect(CHRONIX_DRAWER_CSS).toContain('.cx-ui-drawer--placement-right');
    expect(CHRONIX_DRAWER_CSS).toContain('.cx-ui-drawer--placement-top');
    expect(CHRONIX_DRAWER_CSS).toContain('.cx-ui-drawer--placement-bottom');
    expect(CHRONIX_DRAWER_CSS).toContain('.cx-ui-drawer__header');
    expect(CHRONIX_DRAWER_CSS).toContain('.cx-ui-drawer__body');
    expect(CHRONIX_DRAWER_CSS).toContain('.cx-ui-drawer__footer');
  });
});

describe('ensureChronixDrawerStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixDrawerStyles();
    ensureChronixDrawerStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="drawer"]').length).toBe(1);
  });
});
