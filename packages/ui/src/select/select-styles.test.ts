import { describe, expect, it } from 'vitest';

import { CHRONIX_SELECT_CSS, ensureChronixSelectStyles } from './select-styles.js';

describe('CHRONIX_SELECT_CSS', () => {
  it('contains root class', () => {
    expect(CHRONIX_SELECT_CSS).toContain('.cx-ui-select');
  });

  it('contains trigger class', () => {
    expect(CHRONIX_SELECT_CSS).toContain('.cx-ui-select__trigger');
  });

  it('contains dropdown class', () => {
    expect(CHRONIX_SELECT_CSS).toContain('.cx-ui-select__dropdown');
  });

  it('contains option class', () => {
    expect(CHRONIX_SELECT_CSS).toContain('.cx-ui-select__option');
  });

  it('contains filter-input class', () => {
    expect(CHRONIX_SELECT_CSS).toContain('.cx-ui-select__filter-input');
  });

  it('contains arrow class', () => {
    expect(CHRONIX_SELECT_CSS).toContain('.cx-ui-select__arrow');
  });

  it('contains empty class', () => {
    expect(CHRONIX_SELECT_CSS).toContain('.cx-ui-select__empty');
  });

  it('contains tag class', () => {
    expect(CHRONIX_SELECT_CSS).toContain('.cx-ui-select__tag');
  });

  it('contains tag-close class', () => {
    expect(CHRONIX_SELECT_CSS).toContain('.cx-ui-select__tag-close');
  });
});

describe('ensureChronixSelectStyles', () => {
  it('does not throw in non-DOM env', () => {
    expect(() => ensureChronixSelectStyles()).not.toThrow();
  });
});
