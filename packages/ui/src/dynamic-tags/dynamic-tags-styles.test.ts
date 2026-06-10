// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_DYNAMIC_TAGS_CSS, ensureChronixDynamicTagsStyles } from './dynamic-tags-styles.js';

describe('CHRONIX_DYNAMIC_TAGS_CSS', () => {
  it('declares base class', () => {
    expect(CHRONIX_DYNAMIC_TAGS_CSS).toContain('.cx-ui-dynamic-tags');
  });

  it('declares --disabled modifier', () => {
    expect(CHRONIX_DYNAMIC_TAGS_CSS).toContain('.cx-ui-dynamic-tags--disabled');
  });

  it('declares BEM elements for tag, close, and input', () => {
    expect(CHRONIX_DYNAMIC_TAGS_CSS).toContain('.cx-ui-dynamic-tags__tag');
    expect(CHRONIX_DYNAMIC_TAGS_CSS).toContain('.cx-ui-dynamic-tags__close');
    expect(CHRONIX_DYNAMIC_TAGS_CSS).toContain('.cx-ui-dynamic-tags__input');
  });
});

describe('ensureChronixDynamicTagsStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixDynamicTagsStyles();
    ensureChronixDynamicTagsStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="dynamic-tags"]').length).toBe(1);
  });
});
