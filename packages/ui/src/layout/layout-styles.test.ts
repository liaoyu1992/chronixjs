// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_LAYOUT_CSS, ensureChronixLayoutStyles } from './layout-styles.js';

describe('CHRONIX_LAYOUT_CSS', () => {
  it('declares root + sub-component BEM blocks', () => {
    expect(CHRONIX_LAYOUT_CSS).toContain('.cx-ui-layout');
    expect(CHRONIX_LAYOUT_CSS).toContain('.cx-ui-layout--has-sider');
    expect(CHRONIX_LAYOUT_CSS).toContain('.cx-ui-layout__header');
    expect(CHRONIX_LAYOUT_CSS).toContain('.cx-ui-layout__content');
    expect(CHRONIX_LAYOUT_CSS).toContain('.cx-ui-layout__footer');
    expect(CHRONIX_LAYOUT_CSS).toContain('.cx-ui-layout__sider');
    expect(CHRONIX_LAYOUT_CSS).toContain('.cx-ui-layout__sider-trigger');
  });
});

describe('ensureChronixLayoutStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixLayoutStyles();
    ensureChronixLayoutStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="layout"]').length).toBe(1);
  });
});
