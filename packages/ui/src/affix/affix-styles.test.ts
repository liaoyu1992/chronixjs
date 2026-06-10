// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_AFFIX_CSS, ensureChronixAffixStyles } from './affix-styles.js';

describe('CHRONIX_AFFIX_CSS', () => {
  it('declares root + --affixed + placeholder BEM', () => {
    expect(CHRONIX_AFFIX_CSS).toContain('.cx-ui-affix');
    expect(CHRONIX_AFFIX_CSS).toContain('.cx-ui-affix--affixed');
    expect(CHRONIX_AFFIX_CSS).toContain('.cx-ui-affix-placeholder');
  });
});

describe('ensureChronixAffixStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixAffixStyles();
    ensureChronixAffixStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="affix"]').length).toBe(1);
  });
});
