import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChronixMenu } from './chronix-menu.js';

import type { MenuItem } from '@chronixjs/ui';

const ITEMS: readonly MenuItem[] = [
  {
    key: 'a',
    label: 'A',
    icon: undefined,
    disabled: false,
    children: [
      {
        key: 'a.1',
        label: 'A.1',
        icon: undefined,
        disabled: false,
        children: undefined,
      },
    ],
  },
  { key: 'b', label: 'B', icon: undefined, disabled: false, children: undefined },
];

describe('ChronixMenu (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders root <ul> with --mode-vertical default', () => {
    const { container } = render(<ChronixMenu items={ITEMS} />);
    const root = container.firstElementChild as HTMLUListElement;
    expect(root.tagName).toBe('UL');
    expect(root.classList.contains('cx-ui-menu')).toBe(true);
    expect(root.classList.contains('cx-ui-menu--mode-vertical')).toBe(true);
  });

  it('pre-expands ancestor when initial value is a nested leaf', () => {
    const { container } = render(<ChronixMenu items={ITEMS} value="a.1" />);
    expect(container.querySelector('.cx-ui-menu__submenu')).not.toBeNull();
  });

  it('emits onValueChange + onSelect on leaf click', () => {
    const onValueChange = vi.fn();
    const onSelect = vi.fn();
    const { container } = render(
      <ChronixMenu items={ITEMS} onValueChange={onValueChange} onSelect={onSelect} />,
    );
    const rows = container.querySelectorAll('.cx-ui-menu__item-row');
    fireEvent.click(rows[rows.length - 1]!);
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ key: 'b' }));
  });

  it('injects the chronix-menu stylesheet', () => {
    render(<ChronixMenu items={ITEMS} />);
    expect(document.head.querySelector('style[data-chronix-ui="menu"]')).not.toBeNull();
  });
});
