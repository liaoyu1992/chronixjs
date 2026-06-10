// @vitest-environment happy-dom
import { afterAll, describe, expect, it } from 'vitest';

import { CHRONIX_TREE_CSS, ensureChronixTreeStyles } from './tree-styles.js';

// Clean up injected styles after all tests
afterAll(() => {
  const el = document.head.querySelector('style[data-chronix-ui="tree"]');
  if (el) el.remove();
});

describe('ensureChronixTreeStyles', () => {
  it('injects a style element with data-chronix-ui="tree"', () => {
    // Remove any pre-existing style from other test runs
    const preExisting = document.head.querySelector('style[data-chronix-ui="tree"]');
    if (preExisting) preExisting.remove();

    ensureChronixTreeStyles();
    const style = document.head.querySelector('style[data-chronix-ui="tree"]');
    expect(style).not.toBeNull();
    expect(style!.getAttribute('data-chronix-ui')).toBe('tree');
  });

  it('calling twice does not create a duplicate style element', () => {
    ensureChronixTreeStyles();
    const before = document.head.querySelectorAll('style[data-chronix-ui="tree"]').length;
    ensureChronixTreeStyles();
    const after = document.head.querySelectorAll('style[data-chronix-ui="tree"]').length;
    expect(after).toBe(before);
  });

  it('style element contains CSS content', () => {
    const style = document.head.querySelector('style[data-chronix-ui="tree"]');
    expect(style).not.toBeNull();
    expect((style as HTMLStyleElement).textContent).toBeTruthy();
    expect((style as HTMLStyleElement).textContent.length).toBeGreaterThan(0);
  });
});

describe('CHRONIX_TREE_CSS', () => {
  it('contains .cx-ui-tree selector', () => {
    expect(CHRONIX_TREE_CSS).toContain('.cx-ui-tree');
  });

  it('contains .cx-ui-tree__row selector', () => {
    expect(CHRONIX_TREE_CSS).toContain('.cx-ui-tree__row');
  });

  it('contains .cx-ui-tree__arrow selector', () => {
    expect(CHRONIX_TREE_CSS).toContain('.cx-ui-tree__arrow');
  });

  it('contains .cx-ui-tree__drop-indicator selector', () => {
    expect(CHRONIX_TREE_CSS).toContain('.cx-ui-tree__drop-indicator');
  });
});
