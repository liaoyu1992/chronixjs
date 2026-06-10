import { describe, expect, it } from 'vitest';

import { CHRONIX_MENTION_CSS, ensureChronixMentionStyles } from './mention-styles.js';

describe('CHRONIX_MENTION_CSS', () => {
  it('contains root class', () => {
    expect(CHRONIX_MENTION_CSS).toContain('.cx-ui-mention');
  });
  it('contains textarea class', () => {
    expect(CHRONIX_MENTION_CSS).toContain('.cx-ui-mention__textarea');
  });
  it('contains dropdown class', () => {
    expect(CHRONIX_MENTION_CSS).toContain('.cx-ui-mention__dropdown');
  });
  it('contains option class', () => {
    expect(CHRONIX_MENTION_CSS).toContain('.cx-ui-mention__option');
  });
});

describe('ensureChronixMentionStyles', () => {
  it('does not throw in non-DOM env', () => {
    expect(() => ensureChronixMentionStyles()).not.toThrow();
  });
});
