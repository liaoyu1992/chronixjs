// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import {
  CHRONIX_DISCRETE_DIALOG_CSS,
  ensureChronixDiscreteDialogStyles,
} from './discrete-dialog-styles.js';

describe('CHRONIX_DISCRETE_DIALOG_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_DISCRETE_DIALOG_CSS).toContain('.cx-ui-dialog-mask');
    expect(CHRONIX_DISCRETE_DIALOG_CSS).toContain('.cx-ui-dialog');
    expect(CHRONIX_DISCRETE_DIALOG_CSS).toContain('.cx-ui-dialog__title');
    expect(CHRONIX_DISCRETE_DIALOG_CSS).toContain('.cx-ui-dialog__content');
    expect(CHRONIX_DISCRETE_DIALOG_CSS).toContain('.cx-ui-dialog__actions');
    expect(CHRONIX_DISCRETE_DIALOG_CSS).toContain('.cx-ui-dialog__close');
  });

  it('declares all 5 type modifiers', () => {
    for (const t of ['info', 'success', 'warning', 'error', 'default']) {
      expect(CHRONIX_DISCRETE_DIALOG_CSS).toContain(`.cx-ui-dialog--${t}`);
    }
  });

  it('declares mask enter / leave transition classes', () => {
    expect(CHRONIX_DISCRETE_DIALOG_CSS).toContain('.cx-ui-dialog-mask--enter');
    expect(CHRONIX_DISCRETE_DIALOG_CSS).toContain('.cx-ui-dialog-mask--leave');
  });
});

describe('ensureChronixDiscreteDialogStyles', () => {
  it('injects a <style data-chronix-ui="discrete-dialog"> tag exactly once across multiple calls', () => {
    ensureChronixDiscreteDialogStyles();
    ensureChronixDiscreteDialogStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="discrete-dialog"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-dialog');
  });
});
