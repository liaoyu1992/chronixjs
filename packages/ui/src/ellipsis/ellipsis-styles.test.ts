// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_ELLIPSIS_CSS, ensureChronixEllipsisStyles } from './ellipsis-styles.js';

describe('CHRONIX_ELLIPSIS_CSS', () => {
  it('contains the base BEM class', () => {
    expect(CHRONIX_ELLIPSIS_CSS).toContain('.cx-ui-ellipsis');
  });

  it('declares the single-line three-piece for --lines-1', () => {
    expect(CHRONIX_ELLIPSIS_CSS).toMatch(
      /\.cx-ui-ellipsis--lines-1\s*\{[^}]*white-space:\s*nowrap[^}]*text-overflow:\s*ellipsis/s,
    );
  });

  it.each([2, 3, 4, 5] as const)(
    'declares the --lines-%i modifier with -webkit-line-clamp',
    (lineClamp) => {
      const re = new RegExp(
        `\\.cx-ui-ellipsis--lines-${lineClamp}\\s*\\{[^}]*-webkit-line-clamp:\\s*${lineClamp}`,
        's',
      );
      expect(CHRONIX_ELLIPSIS_CSS).toMatch(re);
    },
  );

  it('declares the --with-tooltip modifier with cursor: help', () => {
    expect(CHRONIX_ELLIPSIS_CSS).toMatch(/\.cx-ui-ellipsis--with-tooltip\s*\{[^}]*cursor:\s*help/s);
  });

  it('uses var() theme tokens with fallbacks', () => {
    expect(CHRONIX_ELLIPSIS_CSS).toContain('var(--cx-ui-font-family');
    expect(CHRONIX_ELLIPSIS_CSS).toContain('var(--cx-ui-ellipsis-text-color');
  });
});

describe('ensureChronixEllipsisStyles', () => {
  it('injects a <style data-chronix-ui="ellipsis"> tag exactly once', () => {
    ensureChronixEllipsisStyles();
    ensureChronixEllipsisStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="ellipsis"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-ellipsis');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="ellipsis"]').forEach((s) => s.remove());
    ensureChronixEllipsisStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="ellipsis"]');
    expect(styles.length).toBe(0);
  });
});
