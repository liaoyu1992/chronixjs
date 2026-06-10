// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_ICON_CSS, ensureChronixIconStyles } from './icon-styles.js';

describe('CHRONIX_ICON_CSS', () => {
  it('declares base + --missing modifier', () => {
    expect(CHRONIX_ICON_CSS).toContain('.cx-ui-icon');
    expect(CHRONIX_ICON_CSS).toContain('.cx-ui-icon--missing');
  });

  it('uses fill: currentColor for SVG color inheritance', () => {
    expect(CHRONIX_ICON_CSS).toContain('fill: currentColor');
  });
});

describe('ensureChronixIconStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixIconStyles();
    ensureChronixIconStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="icon"]').length).toBe(1);
  });
});
