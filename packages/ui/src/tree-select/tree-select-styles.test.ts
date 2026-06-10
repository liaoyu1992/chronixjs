import { describe, expect, it } from 'vitest';

import { CHRONIX_TREE_SELECT_CSS, ensureChronixTreeSelectStyles } from './tree-select-styles.js';

describe('CHRONIX_TREE_SELECT_CSS', () => {
  it('contains root class', () => {
    expect(CHRONIX_TREE_SELECT_CSS).toContain('.cx-ui-tree-select');
  });
  it('contains trigger class', () => {
    expect(CHRONIX_TREE_SELECT_CSS).toContain('.cx-ui-tree-select__trigger');
  });
  it('contains dropdown class', () => {
    expect(CHRONIX_TREE_SELECT_CSS).toContain('.cx-ui-tree-select__dropdown');
  });
  it('contains tree-row class', () => {
    expect(CHRONIX_TREE_SELECT_CSS).toContain('.cx-ui-tree-select__tree-row');
  });
  it('contains tag class', () => {
    expect(CHRONIX_TREE_SELECT_CSS).toContain('.cx-ui-tree-select__tag');
  });
});

describe('ensureChronixTreeSelectStyles', () => {
  it('does not throw in non-DOM env', () => {
    expect(() => ensureChronixTreeSelectStyles()).not.toThrow();
  });
});
