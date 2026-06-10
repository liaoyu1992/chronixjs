// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_MENU_CSS, ensureChronixMenuStyles } from './menu-styles.js';

describe('CHRONIX_MENU_CSS', () => {
  it('declares menu + item + submenu + mode modifiers + --active + --expanded', () => {
    expect(CHRONIX_MENU_CSS).toContain('.cx-ui-menu');
    expect(CHRONIX_MENU_CSS).toContain('.cx-ui-menu--mode-vertical');
    expect(CHRONIX_MENU_CSS).toContain('.cx-ui-menu--mode-horizontal');
    expect(CHRONIX_MENU_CSS).toContain('.cx-ui-menu--collapsed');
    expect(CHRONIX_MENU_CSS).toContain('.cx-ui-menu__item');
    expect(CHRONIX_MENU_CSS).toContain('.cx-ui-menu__item-row');
    expect(CHRONIX_MENU_CSS).toContain('.cx-ui-menu__item--active');
    expect(CHRONIX_MENU_CSS).toContain('.cx-ui-menu__item--expanded');
    expect(CHRONIX_MENU_CSS).toContain('.cx-ui-menu__submenu');
  });
});

describe('ensureChronixMenuStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixMenuStyles();
    ensureChronixMenuStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="menu"]').length).toBe(1);
  });
});
