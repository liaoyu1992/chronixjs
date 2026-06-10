// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import {
  CHRONIX_NOTIFICATION_CSS,
  ensureChronixNotificationStyles,
} from './notification-styles.js';

describe('CHRONIX_NOTIFICATION_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_NOTIFICATION_CSS).toContain('.cx-ui-notification');
    expect(CHRONIX_NOTIFICATION_CSS).toContain('.cx-ui-notification__title');
    expect(CHRONIX_NOTIFICATION_CSS).toContain('.cx-ui-notification__description');
    expect(CHRONIX_NOTIFICATION_CSS).toContain('.cx-ui-notification__close');
  });

  it('declares all 4 type modifiers', () => {
    for (const t of ['info', 'success', 'warning', 'error']) {
      expect(CHRONIX_NOTIFICATION_CSS).toContain(`.cx-ui-notification--${t}`);
    }
  });

  it('declares enter / leave transition classes', () => {
    expect(CHRONIX_NOTIFICATION_CSS).toContain('.cx-ui-notification--enter');
    expect(CHRONIX_NOTIFICATION_CSS).toContain('.cx-ui-notification--leave');
  });
});

describe('ensureChronixNotificationStyles', () => {
  it('injects a <style data-chronix-ui="notification"> tag exactly once across multiple calls', () => {
    ensureChronixNotificationStyles();
    ensureChronixNotificationStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="notification"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-notification');
  });
});
