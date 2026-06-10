import { describe, expect, it } from 'vitest';

import {
  resolveDropdownClassList,
  resolveDropdownOptionClassList,
} from './resolve-dropdown-class-list.js';

describe('resolveDropdownClassList', () => {
  it('returns base + placement modifier when closed', () => {
    expect(
      resolveDropdownClassList({
        actualPlacement: 'bottom-start',
        open: false,
      }),
    ).toEqual(['cx-ui-dropdown', 'cx-ui-dropdown--bottom-start']);
  });

  it('adds --open when open=true', () => {
    expect(resolveDropdownClassList({ actualPlacement: 'top', open: true })).toContain(
      'cx-ui-dropdown--open',
    );
  });
});

describe('resolveDropdownOptionClassList', () => {
  it('returns base only when not active and not disabled', () => {
    expect(resolveDropdownOptionClassList({ active: false, disabled: false })).toEqual([
      'cx-ui-dropdown__option',
    ]);
  });

  it('adds --active when active=true', () => {
    expect(resolveDropdownOptionClassList({ active: true, disabled: false })).toContain(
      'cx-ui-dropdown__option--active',
    );
  });

  it('adds --disabled when disabled=true', () => {
    expect(resolveDropdownOptionClassList({ active: false, disabled: true })).toContain(
      'cx-ui-dropdown__option--disabled',
    );
  });
});
