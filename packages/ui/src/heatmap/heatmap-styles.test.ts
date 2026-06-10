// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_HEATMAP_CSS, ensureChronixHeatmapStyles } from './heatmap-styles.js';

describe('CHRONIX_HEATMAP_CSS', () => {
  it('declares base + __cell element', () => {
    expect(CHRONIX_HEATMAP_CSS).toContain('.cx-ui-heatmap');
    expect(CHRONIX_HEATMAP_CSS).toContain('.cx-ui-heatmap__cell');
  });
});

describe('ensureChronixHeatmapStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixHeatmapStyles();
    ensureChronixHeatmapStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="heatmap"]').length).toBe(1);
  });
});
