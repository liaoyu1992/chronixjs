// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_BUTTON_GROUP_CSS, ensureChronixButtonGroupStyles } from './button-group-styles.js';

describe('CHRONIX_BUTTON_GROUP_CSS', () => {
  it('declares the base + 2 direction modifiers', () => {
    expect(CHRONIX_BUTTON_GROUP_CSS).toContain('.cx-ui-button-group');
    expect(CHRONIX_BUTTON_GROUP_CSS).toContain('.cx-ui-button-group--horizontal');
    expect(CHRONIX_BUTTON_GROUP_CSS).toContain('.cx-ui-button-group--vertical');
  });

  it('merges adjacent button borders via :not(:first/last-child) rules', () => {
    expect(CHRONIX_BUTTON_GROUP_CSS).toContain(':not(:first-child)');
    expect(CHRONIX_BUTTON_GROUP_CSS).toContain(':not(:last-child)');
  });
});

describe('ensureChronixButtonGroupStyles', () => {
  it('injects exactly one <style data-chronix-ui="button-group"> tag', () => {
    ensureChronixButtonGroupStyles();
    ensureChronixButtonGroupStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="button-group"]').length).toBe(1);
  });
});
