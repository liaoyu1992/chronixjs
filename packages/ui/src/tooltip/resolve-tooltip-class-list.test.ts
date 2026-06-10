import { describe, expect, it } from 'vitest';

import { resolveTooltipClassList } from './resolve-tooltip-class-list.js';

describe('resolveTooltipClassList', () => {
  it('returns base + --top for default placement (closed)', () => {
    expect(resolveTooltipClassList({ actualPlacement: 'top', open: false })).toEqual([
      'cx-ui-tooltip',
      'cx-ui-tooltip--top',
    ]);
  });

  it('adds --open when open=true', () => {
    expect(resolveTooltipClassList({ actualPlacement: 'top', open: true })).toContain(
      'cx-ui-tooltip--open',
    );
  });

  it('emits placement modifier for bottom-end', () => {
    expect(resolveTooltipClassList({ actualPlacement: 'bottom-end', open: false })).toContain(
      'cx-ui-tooltip--bottom-end',
    );
  });
});
