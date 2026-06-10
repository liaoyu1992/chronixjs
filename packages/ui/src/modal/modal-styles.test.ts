// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_MODAL_CSS, ensureChronixModalStyles } from './modal-styles.js';

describe('CHRONIX_MODAL_CSS', () => {
  it('declares wrapper + mask + panel + header + body + footer BEM elements', () => {
    expect(CHRONIX_MODAL_CSS).toContain('.cx-ui-modal-wrapper');
    expect(CHRONIX_MODAL_CSS).toContain('.cx-ui-modal__mask');
    expect(CHRONIX_MODAL_CSS).toContain('.cx-ui-modal__header');
    expect(CHRONIX_MODAL_CSS).toContain('.cx-ui-modal__title');
    expect(CHRONIX_MODAL_CSS).toContain('.cx-ui-modal__close');
    expect(CHRONIX_MODAL_CSS).toContain('.cx-ui-modal__body');
    expect(CHRONIX_MODAL_CSS).toContain('.cx-ui-modal__footer');
  });

  it('positions wrapper as fixed inset:0 for viewport coverage', () => {
    expect(CHRONIX_MODAL_CSS).toMatch(/position:\s*fixed/);
    expect(CHRONIX_MODAL_CSS).toMatch(/inset:\s*0/);
  });
});

describe('ensureChronixModalStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixModalStyles();
    ensureChronixModalStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="modal"]').length).toBe(1);
  });
});
