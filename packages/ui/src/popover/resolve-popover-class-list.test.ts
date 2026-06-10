import { describe, expect, it } from 'vitest';

import { resolvePopoverClassList } from './resolve-popover-class-list.js';

describe('resolvePopoverClassList', () => {
  it('returns base + --bottom for default actualPlacement (closed)', () => {
    expect(resolvePopoverClassList({ actualPlacement: 'bottom', open: false })).toEqual([
      'cx-ui-popover',
      'cx-ui-popover--bottom',
    ]);
  });

  it('adds --open when open=true', () => {
    expect(resolvePopoverClassList({ actualPlacement: 'bottom', open: true })).toContain(
      'cx-ui-popover--open',
    );
  });

  it.each([
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'left',
    'left-start',
    'left-end',
    'right',
    'right-start',
    'right-end',
  ] as const)('emits --%s modifier per placement', (placement) => {
    expect(resolvePopoverClassList({ actualPlacement: placement, open: false })).toContain(
      `cx-ui-popover--${placement}`,
    );
  });
});
