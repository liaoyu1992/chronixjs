import { resetPopupZIndexForTests, type DropdownOption } from '@chronixjs/ui';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixDropdown } from './chronix-dropdown.js';

const OPTIONS: readonly DropdownOption[] = [
  { key: 'a', label: 'Alpha', value: 'a', disabled: false, icon: undefined },
  { key: 'b', label: 'Beta', value: 'b', disabled: false, icon: undefined },
  { key: 'c', label: 'Gamma', value: 'c', disabled: true, icon: undefined },
];

describe('ChronixDropdown (react)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders trigger span without panel when show=false manual', () => {
    const { container } = render(
      <ChronixDropdown show={false} trigger="manual" options={OPTIONS}>
        <button>menu</button>
      </ChronixDropdown>,
    );
    expect(container.querySelector('.cx-ui-popover__trigger')).not.toBeNull();
    expect(document.querySelector('.cx-ui-dropdown')).toBeNull();
  });

  it('portals panel + options when show=true', () => {
    render(
      <ChronixDropdown show trigger="manual" options={OPTIONS}>
        <button>menu</button>
      </ChronixDropdown>,
    );
    const panel = document.querySelector('.cx-ui-dropdown')!;
    expect(panel.classList.contains('cx-ui-dropdown--open')).toBe(true);
    expect(panel.querySelectorAll('.cx-ui-dropdown__option').length).toBe(3);
    expect(
      panel
        .querySelectorAll('.cx-ui-dropdown__option')[2]!
        .classList.contains('cx-ui-dropdown__option--disabled'),
    ).toBe(true);
  });

  it('emits onSelect when clicking an enabled option', () => {
    const onSelect = vi.fn();
    render(
      <ChronixDropdown show trigger="manual" options={OPTIONS} onSelect={onSelect}>
        <button>menu</button>
      </ChronixDropdown>,
    );
    const first = document.querySelector<HTMLElement>('.cx-ui-dropdown__option')!;
    fireEvent.mouseDown(first);
    expect(onSelect).toHaveBeenCalledWith(OPTIONS[0]);
  });

  it('injects the chronix-dropdown stylesheet', () => {
    render(
      <ChronixDropdown options={OPTIONS}>
        <button />
      </ChronixDropdown>,
    );
    expect(document.head.querySelector('style[data-chronix-ui="dropdown"]')).not.toBeNull();
  });
});
