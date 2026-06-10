// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_TIMELINE_CSS, ensureChronixTimelineStyles } from './timeline-styles.js';

describe('CHRONIX_TIMELINE_CSS', () => {
  it('contains the base BEM classes', () => {
    expect(CHRONIX_TIMELINE_CSS).toContain('.cx-ui-timeline');
    expect(CHRONIX_TIMELINE_CSS).toContain('.cx-ui-timeline__item');
    expect(CHRONIX_TIMELINE_CSS).toContain('.cx-ui-timeline__indicator');
    expect(CHRONIX_TIMELINE_CSS).toContain('.cx-ui-timeline__dot');
    expect(CHRONIX_TIMELINE_CSS).toContain('.cx-ui-timeline__line');
    expect(CHRONIX_TIMELINE_CSS).toContain('.cx-ui-timeline__content');
    expect(CHRONIX_TIMELINE_CSS).toContain('.cx-ui-timeline__title');
    expect(CHRONIX_TIMELINE_CSS).toContain('.cx-ui-timeline__description');
    expect(CHRONIX_TIMELINE_CSS).toContain('.cx-ui-timeline__timestamp');
  });

  it('declares all 5 color modifier selectors', () => {
    for (const c of ['default', 'success', 'warning', 'error', 'info']) {
      expect(CHRONIX_TIMELINE_CSS).toContain(`.cx-ui-timeline__item--color-${c}`);
    }
  });

  it('declares both line type modifiers', () => {
    expect(CHRONIX_TIMELINE_CSS).toContain('.cx-ui-timeline__item--line-default');
    expect(CHRONIX_TIMELINE_CSS).toContain('.cx-ui-timeline__item--line-dashed');
  });

  it('uses CSS-var tokens with fallbacks for theme reads', () => {
    expect(CHRONIX_TIMELINE_CSS).toContain('var(--cx-ui-timeline-dot-color,');
    expect(CHRONIX_TIMELINE_CSS).toContain('var(--cx-ui-timeline-dot-color-success,');
    expect(CHRONIX_TIMELINE_CSS).toContain('var(--cx-ui-timeline-line-color,');
    expect(CHRONIX_TIMELINE_CSS).toContain('var(--cx-ui-timeline-title-color,');
  });
});

describe('ensureChronixTimelineStyles', () => {
  it('injects a <style data-chronix-ui="timeline"> tag exactly once', () => {
    ensureChronixTimelineStyles();
    ensureChronixTimelineStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="timeline"]');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('.cx-ui-timeline');
  });

  it('does not re-inject after the <style> tag is removed (sticky flag)', () => {
    document.head.querySelectorAll('style[data-chronix-ui="timeline"]').forEach((s) => s.remove());
    ensureChronixTimelineStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="timeline"]');
    expect(styles.length).toBe(0);
  });
});
