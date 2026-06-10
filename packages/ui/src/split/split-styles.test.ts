// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_SPLIT_CSS, ensureChronixSplitStyles } from './split-styles.js';

describe('CHRONIX_SPLIT_CSS', () => {
  it('declares root + direction + pane + bar BEM', () => {
    expect(CHRONIX_SPLIT_CSS).toContain('.cx-ui-split');
    expect(CHRONIX_SPLIT_CSS).toContain('.cx-ui-split--direction-horizontal');
    expect(CHRONIX_SPLIT_CSS).toContain('.cx-ui-split--direction-vertical');
    expect(CHRONIX_SPLIT_CSS).toContain('.cx-ui-split__pane');
    expect(CHRONIX_SPLIT_CSS).toContain('.cx-ui-split__pane--first');
    expect(CHRONIX_SPLIT_CSS).toContain('.cx-ui-split__pane--second');
    expect(CHRONIX_SPLIT_CSS).toContain('.cx-ui-split__bar');
  });
});

describe('ensureChronixSplitStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixSplitStyles();
    ensureChronixSplitStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="split"]').length).toBe(1);
  });
});
