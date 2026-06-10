// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_COLLAPSE_CSS, ensureChronixCollapseStyles } from './collapse-styles.js';

describe('CHRONIX_COLLAPSE_CSS', () => {
  it('declares root + item + header + arrow + body BEM', () => {
    expect(CHRONIX_COLLAPSE_CSS).toContain('.cx-ui-collapse');
    expect(CHRONIX_COLLAPSE_CSS).toContain('.cx-ui-collapse__item');
    expect(CHRONIX_COLLAPSE_CSS).toContain('.cx-ui-collapse__item--expanded');
    expect(CHRONIX_COLLAPSE_CSS).toContain('.cx-ui-collapse__item--disabled');
    expect(CHRONIX_COLLAPSE_CSS).toContain('.cx-ui-collapse__header');
    expect(CHRONIX_COLLAPSE_CSS).toContain('.cx-ui-collapse__arrow');
    expect(CHRONIX_COLLAPSE_CSS).toContain('.cx-ui-collapse__title');
    expect(CHRONIX_COLLAPSE_CSS).toContain('.cx-ui-collapse__body');
    expect(CHRONIX_COLLAPSE_CSS).toContain('.cx-ui-collapse__content');
  });
});

describe('ensureChronixCollapseStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixCollapseStyles();
    ensureChronixCollapseStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="collapse"]').length).toBe(1);
  });
});
