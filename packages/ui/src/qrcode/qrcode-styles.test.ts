// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_QRCODE_CSS, ensureChronixQrCodeStyles } from './qrcode-styles.js';

describe('CHRONIX_QRCODE_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_QRCODE_CSS).toContain('.cx-ui-qrcode');
    expect(CHRONIX_QRCODE_CSS).toContain('.cx-ui-qrcode__svg');
    expect(CHRONIX_QRCODE_CSS).toContain('.cx-ui-qrcode__unavailable-message');
  });

  it('declares the --unavailable placeholder modifier selector', () => {
    expect(CHRONIX_QRCODE_CSS).toContain('.cx-ui-qrcode--unavailable');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_QRCODE_CSS).toContain('var(--cx-ui-qrcode-unavailable-bg,');
    expect(CHRONIX_QRCODE_CSS).toContain('var(--cx-ui-qrcode-unavailable-color,');
  });
});

describe('ensureChronixQrCodeStyles', () => {
  it('injects a <style data-chronix-ui="qrcode"> tag exactly once', () => {
    ensureChronixQrCodeStyles();
    ensureChronixQrCodeStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="qrcode"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-qrcode');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="qrcode"]').forEach((s) => s.remove());
    ensureChronixQrCodeStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="qrcode"]');
    expect(styles.length).toBe(0);
  });
});
