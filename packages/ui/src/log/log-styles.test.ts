// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_LOG_CSS, ensureChronixLogStyles } from './log-styles.js';

describe('CHRONIX_LOG_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_LOG_CSS).toContain('.cx-ui-log');
    expect(CHRONIX_LOG_CSS).toContain('.cx-ui-log__lines');
    expect(CHRONIX_LOG_CSS).toContain('.cx-ui-log__line');
    expect(CHRONIX_LOG_CSS).toContain('.cx-ui-log__line-number');
    expect(CHRONIX_LOG_CSS).toContain('.cx-ui-log__line-content');
    expect(CHRONIX_LOG_CSS).toContain('.cx-ui-log__loading');
  });

  it('declares all 3 root modifier rules', () => {
    expect(CHRONIX_LOG_CSS).toContain('.cx-ui-log--with-line-numbers');
    expect(CHRONIX_LOG_CSS).toContain('.cx-ui-log--wrap-lines');
  });

  it('resets the <ol> user-agent CSS (list-style + margin + padding)', () => {
    expect(CHRONIX_LOG_CSS).toMatch(
      /\.cx-ui-log__lines\s*\{[^}]*list-style:\s*none[^}]*margin:\s*0[^}]*padding:\s*0/s,
    );
  });

  it('declares white-space: pre on .cx-ui-log__line (default)', () => {
    expect(CHRONIX_LOG_CSS).toMatch(/\.cx-ui-log__line\s*\{[^}]*white-space:\s*pre[^}]*\}/s);
  });

  it('flips to pre-wrap when --wrap-lines is present', () => {
    expect(CHRONIX_LOG_CSS).toMatch(
      /\.cx-ui-log--wrap-lines\s+\.cx-ui-log__line\s*\{[^}]*white-space:\s*pre-wrap/s,
    );
  });

  it('declares user-select: none on the line-number span', () => {
    expect(CHRONIX_LOG_CSS).toMatch(/\.cx-ui-log__line-number\s*\{[^}]*user-select:\s*none/s);
  });

  it('uses var() theme tokens with fallbacks', () => {
    expect(CHRONIX_LOG_CSS).toContain('var(--cx-ui-log-font-family');
    expect(CHRONIX_LOG_CSS).toContain('var(--cx-ui-log-bg');
    expect(CHRONIX_LOG_CSS).toContain('var(--cx-ui-log-text-color');
  });
});

describe('ensureChronixLogStyles', () => {
  it('injects a <style data-chronix-ui="log"> tag exactly once', () => {
    ensureChronixLogStyles();
    ensureChronixLogStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="log"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-log');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="log"]').forEach((s) => s.remove());
    ensureChronixLogStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="log"]');
    expect(styles.length).toBe(0);
  });
});
