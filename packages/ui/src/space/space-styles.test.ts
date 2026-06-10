// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_SPACE_CSS, ensureChronixSpaceStyles } from './space-styles.js';

describe('CHRONIX_SPACE_CSS', () => {
  it('contains the base class', () => {
    expect(CHRONIX_SPACE_CSS).toContain('.cx-ui-space');
  });

  it('declares the qualitative modifiers (vertical / wrap / inline)', () => {
    expect(CHRONIX_SPACE_CSS).toContain('.cx-ui-space--vertical');
    expect(CHRONIX_SPACE_CSS).toContain('.cx-ui-space--wrap');
    expect(CHRONIX_SPACE_CSS).toContain('.cx-ui-space--inline');
  });

  it('declares all 5 align modifiers', () => {
    for (const a of ['start', 'center', 'end', 'baseline', 'stretch']) {
      expect(CHRONIX_SPACE_CSS).toContain(`.cx-ui-space--align-${a}`);
    }
  });

  it('declares all 6 justify modifiers', () => {
    for (const j of ['start', 'center', 'end', 'space-around', 'space-between', 'space-evenly']) {
      expect(CHRONIX_SPACE_CSS).toContain(`.cx-ui-space--justify-${j}`);
    }
  });
});

describe('ensureChronixSpaceStyles', () => {
  it('injects a <style data-chronix-ui="space"> tag exactly once', () => {
    ensureChronixSpaceStyles();
    ensureChronixSpaceStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="space"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-space');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="space"]').forEach((s) => s.remove());
    ensureChronixSpaceStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="space"]');
    expect(styles.length).toBe(0);
  });
});
