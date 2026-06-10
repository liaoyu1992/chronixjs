// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_POPCONFIRM_CSS, ensureChronixPopconfirmStyles } from './popconfirm-styles.js';

describe('CHRONIX_POPCONFIRM_CSS', () => {
  it('declares base + __header + __icon + __title + __actions + __action BEM elements', () => {
    expect(CHRONIX_POPCONFIRM_CSS).toContain('.cx-ui-popconfirm');
    expect(CHRONIX_POPCONFIRM_CSS).toContain('.cx-ui-popconfirm__header');
    expect(CHRONIX_POPCONFIRM_CSS).toContain('.cx-ui-popconfirm__icon');
    expect(CHRONIX_POPCONFIRM_CSS).toContain('.cx-ui-popconfirm__title');
    expect(CHRONIX_POPCONFIRM_CSS).toContain('.cx-ui-popconfirm__actions');
    expect(CHRONIX_POPCONFIRM_CSS).toContain('.cx-ui-popconfirm__action');
    expect(CHRONIX_POPCONFIRM_CSS).toContain('.cx-ui-popconfirm__action--positive');
  });
});

describe('ensureChronixPopconfirmStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixPopconfirmStyles();
    ensureChronixPopconfirmStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="popconfirm"]').length).toBe(1);
  });
});
