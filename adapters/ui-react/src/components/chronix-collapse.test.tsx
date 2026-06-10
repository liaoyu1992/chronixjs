import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChronixCollapse } from './chronix-collapse.js';

const items = [
  { key: 'a', title: 'A title', content: 'A body', disabled: false },
  { key: 'b', title: 'B title', content: 'B body', disabled: false },
] as const;

describe('ChronixCollapse (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders one item per items entry with the title in the header', () => {
    const { container } = render(<ChronixCollapse items={items} />);
    const itemEls = container.querySelectorAll('.cx-ui-collapse__item');
    expect(itemEls.length).toBe(2);
    expect(itemEls[0]?.textContent).toContain('A title');
  });

  it('marks the expanded item with --expanded when value matches', () => {
    const { container } = render(<ChronixCollapse items={items} value={['a']} />);
    const itemA = container.querySelector('[data-item-key="a"]')!;
    expect(itemA.classList.contains('cx-ui-collapse__item--expanded')).toBe(true);
  });

  it('calls onValueChange on header click (accordion mode)', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <ChronixCollapse items={items} accordion onValueChange={onValueChange} />,
    );
    const header = container.querySelector('[data-item-key="a"] .cx-ui-collapse__header')!;
    fireEvent.click(header);
    expect(onValueChange).toHaveBeenCalledWith('a');
  });

  it('switches arrow placement modifier on root', () => {
    const { container } = render(<ChronixCollapse items={items} arrowPlacement="right" />);
    expect(container.querySelector('.cx-ui-collapse--arrow-right')).not.toBeNull();
  });

  it('injects the chronix-collapse stylesheet', () => {
    render(<ChronixCollapse items={items} />);
    expect(document.head.querySelector('style[data-chronix-ui="collapse"]')).not.toBeNull();
  });
});
