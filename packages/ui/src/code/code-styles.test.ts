// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_CODE_CSS, ensureChronixCodeStyles } from './code-styles.js';

describe('CHRONIX_CODE_CSS', () => {
  it('declares base + --block + --inline modifiers', () => {
    expect(CHRONIX_CODE_CSS).toContain('.cx-ui-code');
    expect(CHRONIX_CODE_CSS).toContain('.cx-ui-code--block');
    expect(CHRONIX_CODE_CSS).toContain('.cx-ui-code--inline');
  });

  it('preserves whitespace via white-space: pre on block', () => {
    expect(CHRONIX_CODE_CSS).toMatch(/\.cx-ui-code--block\s*\{[^}]*white-space:\s*pre[^}]*\}/s);
  });
});

describe('ensureChronixCodeStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixCodeStyles();
    ensureChronixCodeStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="code"]').length).toBe(1);
  });
});
