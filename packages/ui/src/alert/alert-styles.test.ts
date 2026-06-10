// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_ALERT_CSS, ensureChronixAlertStyles } from './alert-styles.js';

describe('CHRONIX_ALERT_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_ALERT_CSS).toContain('.cx-ui-alert');
    expect(CHRONIX_ALERT_CSS).toContain('.cx-ui-alert__title');
    expect(CHRONIX_ALERT_CSS).toContain('.cx-ui-alert__content');
    expect(CHRONIX_ALERT_CSS).toContain('.cx-ui-alert__close');
  });

  it('declares all 5 type modifiers', () => {
    for (const t of ['default', 'info', 'success', 'warning', 'error']) {
      expect(CHRONIX_ALERT_CSS).toContain(`.cx-ui-alert--${t}`);
    }
  });

  it('declares closable + bordered + with-title modifiers', () => {
    expect(CHRONIX_ALERT_CSS).toContain('.cx-ui-alert--closable');
    expect(CHRONIX_ALERT_CSS).toContain('.cx-ui-alert--bordered');
  });
});

describe('ensureChronixAlertStyles', () => {
  it('injects a <style data-chronix-ui="alert"> tag exactly once across multiple calls', () => {
    ensureChronixAlertStyles();
    ensureChronixAlertStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="alert"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-alert');
  });
});
