// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_POPOVER_CSS, ensureChronixPopoverStyles } from './popover-styles.js';

describe('CHRONIX_POPOVER_CSS', () => {
  it('declares base + --open + __trigger BEM elements', () => {
    expect(CHRONIX_POPOVER_CSS).toContain('.cx-ui-popover');
    expect(CHRONIX_POPOVER_CSS).toContain('.cx-ui-popover--open');
    expect(CHRONIX_POPOVER_CSS).toContain('.cx-ui-popover__trigger');
  });

  it('declares position: fixed for portal-mounted layout', () => {
    expect(CHRONIX_POPOVER_CSS).toMatch(/position:\s*fixed/);
  });
});

describe('ensureChronixPopoverStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixPopoverStyles();
    ensureChronixPopoverStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="popover"]').length).toBe(1);
  });
});
