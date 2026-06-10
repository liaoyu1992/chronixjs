import { describe, expect, it } from 'vitest';

import { resolvePopSelectClassList } from './resolve-pop-select-class-list.js';

describe('resolvePopSelectClassList', () => {
  it('returns base + --bottom-start for default placement (closed)', () => {
    expect(
      resolvePopSelectClassList({
        actualPlacement: 'bottom-start',
        open: false,
      }),
    ).toEqual(['cx-ui-pop-select', 'cx-ui-pop-select--bottom-start']);
  });

  it('adds --open when open=true', () => {
    expect(
      resolvePopSelectClassList({
        actualPlacement: 'bottom-start',
        open: true,
      }),
    ).toContain('cx-ui-pop-select--open');
  });
});
