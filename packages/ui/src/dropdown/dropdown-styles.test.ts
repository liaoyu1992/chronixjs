// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_DROPDOWN_CSS, ensureChronixDropdownStyles } from './dropdown-styles.js';

describe('CHRONIX_DROPDOWN_CSS', () => {
  it('declares panel + list + option BEM elements + --open + --active + --disabled modifiers', () => {
    expect(CHRONIX_DROPDOWN_CSS).toContain('.cx-ui-dropdown');
    expect(CHRONIX_DROPDOWN_CSS).toContain('.cx-ui-dropdown--open');
    expect(CHRONIX_DROPDOWN_CSS).toContain('.cx-ui-dropdown__list');
    expect(CHRONIX_DROPDOWN_CSS).toContain('.cx-ui-dropdown__option');
    expect(CHRONIX_DROPDOWN_CSS).toContain('.cx-ui-dropdown__option--active');
    expect(CHRONIX_DROPDOWN_CSS).toContain('.cx-ui-dropdown__option--disabled');
  });

  it('positions panel as fixed for portal-mounted layout', () => {
    expect(CHRONIX_DROPDOWN_CSS).toMatch(/position:\s*fixed/);
  });
});

describe('ensureChronixDropdownStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixDropdownStyles();
    ensureChronixDropdownStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="dropdown"]').length).toBe(1);
  });
});
