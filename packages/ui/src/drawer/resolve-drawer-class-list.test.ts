import { describe, expect, it } from 'vitest';

import {
  resolveDrawerPanelClassList,
  resolveDrawerWrapperClassList,
} from './resolve-drawer-class-list.js';

describe('resolveDrawerWrapperClassList', () => {
  it.each(['left', 'right', 'top', 'bottom'] as const)(
    'emits --placement-%s modifier',
    (placement) => {
      expect(resolveDrawerWrapperClassList({ open: false, mask: false, placement })).toContain(
        `cx-ui-drawer-wrapper--placement-${placement}`,
      );
    },
  );

  it('adds --open when open=true', () => {
    expect(
      resolveDrawerWrapperClassList({
        open: true,
        mask: false,
        placement: 'right',
      }),
    ).toContain('cx-ui-drawer-wrapper--open');
  });

  it('adds --with-mask when mask=true', () => {
    expect(
      resolveDrawerWrapperClassList({
        open: false,
        mask: true,
        placement: 'right',
      }),
    ).toContain('cx-ui-drawer-wrapper--with-mask');
  });
});

describe('resolveDrawerPanelClassList', () => {
  it.each(['left', 'right', 'top', 'bottom'] as const)(
    'emits panel --placement-%s modifier',
    (placement) => {
      expect(resolveDrawerPanelClassList({ placement })).toEqual([
        'cx-ui-drawer',
        `cx-ui-drawer--placement-${placement}`,
      ]);
    },
  );
});
