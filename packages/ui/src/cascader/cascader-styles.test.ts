import { describe, expect, it } from 'vitest';

import { CHRONIX_CASCADER_CSS, ensureChronixCascaderStyles } from './cascader-styles.js';

describe('CHRONIX_CASCADER_CSS', () => {
  it('contains root class', () => {
    expect(CHRONIX_CASCADER_CSS).toContain('.cx-ui-cascader');
  });
  it('contains panel class', () => {
    expect(CHRONIX_CASCADER_CSS).toContain('.cx-ui-cascader__panel');
  });
  it('contains option class', () => {
    expect(CHRONIX_CASCADER_CSS).toContain('.cx-ui-cascader__option');
  });
});

describe('ensureChronixCascaderStyles', () => {
  it('does not throw in non-DOM env', () => {
    expect(() => ensureChronixCascaderStyles()).not.toThrow();
  });
});
