// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';

import { CHRONIX_FORM_CSS, ensureChronixFormStyles } from './form-styles.js';

describe('ensureChronixFormStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixFormStyles();
    ensureChronixFormStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="form"]');
    expect(styles.length).toBe(1);
  });

  it('injects style containing BEM root class', () => {
    ensureChronixFormStyles();
    const style = document.head.querySelector('style[data-chronix-ui="form"]')!;
    expect(style).not.toBeNull();
    expect(style.textContent).toContain('.cx-ui-form');
    expect(style.textContent).toContain('.cx-ui-form-item');
    expect(style.textContent).toContain('.cx-ui-form-item-label');
    expect(style.textContent).toContain('.cx-ui-form-item-blank');
    expect(style.textContent).toContain('.cx-ui-form-item-feedback');
  });
});

describe('CHRONIX_FORM_CSS', () => {
  it('contains CSS var tokens', () => {
    expect(CHRONIX_FORM_CSS).toContain('var(--cx-ui');
  });

  it('contains inline modifier', () => {
    expect(CHRONIX_FORM_CSS).toContain('cx-ui-form--inline');
  });

  it('contains grid-template-areas for left label', () => {
    expect(CHRONIX_FORM_CSS).toContain('grid-template-areas');
  });
});
