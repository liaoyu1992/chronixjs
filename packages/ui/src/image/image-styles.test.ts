// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_IMAGE_CSS, ensureChronixImageStyles } from './image-styles.js';

describe('CHRONIX_IMAGE_CSS', () => {
  it('declares root + modifiers + preview BEM', () => {
    expect(CHRONIX_IMAGE_CSS).toContain('.cx-ui-image');
    expect(CHRONIX_IMAGE_CSS).toContain('.cx-ui-image--previewable');
    expect(CHRONIX_IMAGE_CSS).toContain('.cx-ui-image--failed');
    expect(CHRONIX_IMAGE_CSS).toContain('.cx-ui-image-preview');
    expect(CHRONIX_IMAGE_CSS).toContain('.cx-ui-image-preview__img');
  });
});

describe('ensureChronixImageStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixImageStyles();
    ensureChronixImageStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="image"]').length).toBe(1);
  });
});
