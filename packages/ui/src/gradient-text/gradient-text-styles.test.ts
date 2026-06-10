// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import {
  CHRONIX_GRADIENT_TEXT_CSS,
  ensureChronixGradientTextStyles,
} from './gradient-text-styles.js';

describe('CHRONIX_GRADIENT_TEXT_CSS', () => {
  it('declares background-clip: text', () => {
    expect(CHRONIX_GRADIENT_TEXT_CSS).toContain('background-clip: text');
    expect(CHRONIX_GRADIENT_TEXT_CSS).toContain('-webkit-background-clip: text');
  });

  it('sets color: transparent so the gradient is visible', () => {
    expect(CHRONIX_GRADIENT_TEXT_CSS).toContain('color: transparent');
  });
});

describe('ensureChronixGradientTextStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixGradientTextStyles();
    ensureChronixGradientTextStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="gradient-text"]').length).toBe(1);
  });
});
