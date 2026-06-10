import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChronixTabs } from './chronix-tabs.js';

const items = [
  { key: 'a', label: 'A', disabled: false, content: 'first body' },
  { key: 'b', label: 'B', disabled: false, content: 'second body' },
  { key: 'c', label: 'C', disabled: true, content: 'third body' },
] as const;

describe('ChronixTabs (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders 3 tab buttons + the active tab panel', () => {
    const { container } = render(<ChronixTabs items={items} value="a" />);
    const tabs = container.querySelectorAll('[role="tab"]');
    expect(tabs.length).toBe(3);
    expect(container.querySelector('[role="tabpanel"]')?.textContent).toContain('first body');
  });

  it('marks the active tab with aria-selected + --active modifier', () => {
    const { container } = render(<ChronixTabs items={items} value="b" />);
    const activeTab = container.querySelector('[data-tab-key="b"]')!;
    expect(activeTab.getAttribute('aria-selected')).toBe('true');
    expect(activeTab.classList.contains('cx-ui-tabs__tab--active')).toBe(true);
  });

  it('emits onValueChange on tab click', () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <ChronixTabs items={items} value="a" onValueChange={onValueChange} />,
    );
    const tabB = container.querySelector('[data-tab-key="b"]')!;
    fireEvent.click(tabB);
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('drives all 3 modifier classes (type + placement + size)', () => {
    const { container } = render(
      <ChronixTabs items={items} value="a" type="segment" placement="left" size="small" />,
    );
    const root = container.querySelector('.cx-ui-tabs')!;
    expect(root.classList.contains('cx-ui-tabs--type-segment')).toBe(true);
    expect(root.classList.contains('cx-ui-tabs--placement-left')).toBe(true);
    expect(root.classList.contains('cx-ui-tabs--size-small')).toBe(true);
  });

  it('injects the chronix-tabs stylesheet', () => {
    render(<ChronixTabs items={[]} />);
    expect(document.head.querySelector('style[data-chronix-ui="tabs"]')).not.toBeNull();
  });
});
