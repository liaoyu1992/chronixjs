// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_MARQUEE_CSS, ensureChronixMarqueeStyles } from './marquee-styles.js';

describe('CHRONIX_MARQUEE_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_MARQUEE_CSS).toContain('.cx-ui-marquee');
    expect(CHRONIX_MARQUEE_CSS).toContain('.cx-ui-marquee__track');
  });

  it('declares all 4 direction modifier selectors', () => {
    for (const dir of ['left', 'right', 'up', 'down']) {
      expect(CHRONIX_MARQUEE_CSS).toContain(`.cx-ui-marquee--direction-${dir}`);
    }
  });

  it('declares the --pause-on-hover modifier + hover rule', () => {
    expect(CHRONIX_MARQUEE_CSS).toContain('.cx-ui-marquee--pause-on-hover');
    expect(CHRONIX_MARQUEE_CSS).toContain('animation-play-state: paused');
  });

  it('embeds all 4 directional @keyframes blocks', () => {
    expect(CHRONIX_MARQUEE_CSS).toContain('@keyframes cx-ui-marquee-scroll-left');
    expect(CHRONIX_MARQUEE_CSS).toContain('@keyframes cx-ui-marquee-scroll-right');
    expect(CHRONIX_MARQUEE_CSS).toContain('@keyframes cx-ui-marquee-scroll-up');
    expect(CHRONIX_MARQUEE_CSS).toContain('@keyframes cx-ui-marquee-scroll-down');
  });

  it('sets overflow:hidden on the root so off-edge copies stay clipped', () => {
    expect(CHRONIX_MARQUEE_CSS).toMatch(/\.cx-ui-marquee\s*\{[^}]*overflow:\s*hidden/);
  });
});

describe('ensureChronixMarqueeStyles', () => {
  it('injects a <style data-chronix-ui="marquee"> tag exactly once', () => {
    ensureChronixMarqueeStyles();
    ensureChronixMarqueeStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="marquee"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-marquee');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="marquee"]').forEach((s) => s.remove());
    ensureChronixMarqueeStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="marquee"]');
    expect(styles.length).toBe(0);
  });
});
