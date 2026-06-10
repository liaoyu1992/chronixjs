// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_BUTTON_CSS, ensureChronixButtonStyles } from './button-styles.js';

/**
 * Button-stylesheet injection unit tests — Phase 12 (2026-06-02).
 *
 * Verifies the framework-agnostic `ensureChronixButtonStyles()` helper
 * that all 3 adapter packages share. Adapter-level mount tests cover
 * the integration with `defineComponent` / React rendering; these
 * tests cover the bare DOM contract.
 */
describe('CHRONIX_BUTTON_CSS', () => {
  it('contains the base BEM class', () => {
    expect(CHRONIX_BUTTON_CSS).toContain('.cx-ui-button');
  });

  it('declares all 5 variant + size + disabled + block modifiers', () => {
    expect(CHRONIX_BUTTON_CSS).toContain('.cx-ui-button--default');
    expect(CHRONIX_BUTTON_CSS).toContain('.cx-ui-button--primary');
    expect(CHRONIX_BUTTON_CSS).toContain('.cx-ui-button--small');
    expect(CHRONIX_BUTTON_CSS).toContain('.cx-ui-button--medium');
    expect(CHRONIX_BUTTON_CSS).toContain('.cx-ui-button--large');
    expect(CHRONIX_BUTTON_CSS).toContain('.cx-ui-button--disabled');
    expect(CHRONIX_BUTTON_CSS).toContain('.cx-ui-button--block');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_BUTTON_CSS).toContain('var(--cx-ui-button-bg-color,');
    expect(CHRONIX_BUTTON_CSS).toContain('var(--cx-ui-button-bg-color-primary,');
  });
});

describe('ensureChronixButtonStyles', () => {
  // The helper uses a module-level `injected` flag; once set, subsequent
  // calls early-return. We run a single test that verifies both the
  // initial injection and the multi-call idempotence at the same time.
  it('injects a <style data-chronix-ui="button"> tag exactly once across multiple calls', () => {
    ensureChronixButtonStyles();
    ensureChronixButtonStyles();
    ensureChronixButtonStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="button"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-button');
  });

  // Removing the <style> after injection should not cause the helper
  // to re-inject — the local `injected` flag is sticky on purpose. This
  // protects against churn during HMR + repeated mount/unmount cycles.
  it('does not re-inject after a previous <style> tag is removed (sticky flag)', () => {
    // Pre-condition: previous test already injected, so a tag is present.
    document.head.querySelectorAll('style[data-chronix-ui="button"]').forEach((s) => s.remove());
    ensureChronixButtonStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="button"]');
    expect(styles.length).toBe(0);
  });
});
