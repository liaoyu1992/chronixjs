// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_TABS_CSS, ensureChronixTabsStyles } from './tabs-styles.js';

describe('CHRONIX_TABS_CSS', () => {
  it('declares root + type + placement BEM blocks', () => {
    expect(CHRONIX_TABS_CSS).toContain('.cx-ui-tabs');
    expect(CHRONIX_TABS_CSS).toContain('.cx-ui-tabs--type-line');
    expect(CHRONIX_TABS_CSS).toContain('.cx-ui-tabs--type-card');
    expect(CHRONIX_TABS_CSS).toContain('.cx-ui-tabs--type-segment');
    expect(CHRONIX_TABS_CSS).toContain('.cx-ui-tabs--placement-top');
    expect(CHRONIX_TABS_CSS).toContain('.cx-ui-tabs__tab');
    expect(CHRONIX_TABS_CSS).toContain('.cx-ui-tabs__tab--active');
    expect(CHRONIX_TABS_CSS).toContain('.cx-ui-tabs__panel');
  });
});

describe('ensureChronixTabsStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixTabsStyles();
    ensureChronixTabsStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="tabs"]').length).toBe(1);
  });
});
