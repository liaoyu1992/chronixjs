// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_FLEX_CSS, ensureChronixFlexStyles } from './flex-styles.js';

describe('CHRONIX_FLEX_CSS', () => {
  it('contains the base class', () => {
    expect(CHRONIX_FLEX_CSS).toContain('.cx-ui-flex');
  });

  it('declares all 4 direction modifiers', () => {
    for (const d of ['row', 'column', 'row-reverse', 'column-reverse']) {
      expect(CHRONIX_FLEX_CSS).toContain(`.cx-ui-flex--direction-${d}`);
    }
  });

  it('declares all 3 wrap modifiers', () => {
    for (const w of ['nowrap', 'wrap', 'wrap-reverse']) {
      expect(CHRONIX_FLEX_CSS).toContain(`.cx-ui-flex--wrap-${w}`);
    }
  });

  it('declares all 5 align modifiers + 6 justify modifiers', () => {
    for (const a of ['start', 'center', 'end', 'baseline', 'stretch']) {
      expect(CHRONIX_FLEX_CSS).toContain(`.cx-ui-flex--align-${a}`);
    }
    for (const j of ['start', 'center', 'end', 'space-around', 'space-between', 'space-evenly']) {
      expect(CHRONIX_FLEX_CSS).toContain(`.cx-ui-flex--justify-${j}`);
    }
  });

  it('declares the inline modifier', () => {
    expect(CHRONIX_FLEX_CSS).toContain('.cx-ui-flex--inline');
  });
});

describe('ensureChronixFlexStyles', () => {
  it('injects a <style data-chronix-ui="flex"> tag exactly once', () => {
    ensureChronixFlexStyles();
    ensureChronixFlexStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="flex"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-flex');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="flex"]').forEach((s) => s.remove());
    ensureChronixFlexStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="flex"]');
    expect(styles.length).toBe(0);
  });
});
