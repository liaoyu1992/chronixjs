import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChronixBreadcrumb } from './chronix-breadcrumb.js';

import type { BreadcrumbItem } from '@chronixjs/ui';

const SAMPLE_ITEMS: BreadcrumbItem[] = [
  { key: 'home', label: 'Home', href: '/', clickable: false },
  { key: 'docs', label: 'Docs', href: '/docs', clickable: false },
  { key: 'current', label: '', href: undefined, clickable: false },
];

describe('ChronixBreadcrumb (react) — root rendering', () => {
  it('renders a <nav> with the base class + aria-label', () => {
    const { container } = render(<ChronixBreadcrumb items={SAMPLE_ITEMS} />);
    const root = container.querySelector('nav.cx-ui-breadcrumb')!;
    expect(root.tagName).toBe('NAV');
    expect(root.getAttribute('aria-label')).toBe('Breadcrumb');
  });

  it('renders empty <nav> when items is empty', () => {
    const { container } = render(<ChronixBreadcrumb />);
    expect(container.querySelectorAll('.cx-ui-breadcrumb__item')).toHaveLength(0);
  });
});

describe('ChronixBreadcrumb (react) — items rendering', () => {
  it('renders one element per item', () => {
    const { container } = render(<ChronixBreadcrumb items={SAMPLE_ITEMS} />);
    expect(container.querySelectorAll('.cx-ui-breadcrumb__item')).toHaveLength(SAMPLE_ITEMS.length);
  });

  it('renders <a href=...> when item has href', () => {
    const { container } = render(<ChronixBreadcrumb items={SAMPLE_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-breadcrumb__item');
    const homeItem = items[0] as HTMLAnchorElement;
    expect(homeItem.tagName).toBe('A');
    expect(homeItem.getAttribute('href')).toBe('/');
    expect(homeItem.classList.contains('cx-ui-breadcrumb__item--clickable')).toBe(true);
  });

  it('renders <span> for non-clickable trailing items', () => {
    const { container } = render(<ChronixBreadcrumb items={SAMPLE_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-breadcrumb__item');
    const currentItem = items[2]!;
    expect(currentItem.tagName).toBe('SPAN');
    expect(currentItem.classList.contains('cx-ui-breadcrumb__item--clickable')).toBe(false);
    expect(currentItem.classList.contains('cx-ui-breadcrumb__item--current')).toBe(true);
  });

  it('renders <span role="link"> for clickable items without href', () => {
    const items: BreadcrumbItem[] = [
      { key: 'spa', label: 'SPA', href: undefined, clickable: true },
      { key: 'last', label: 'Last', href: undefined, clickable: false },
    ];
    const { container } = render(<ChronixBreadcrumb items={items} />);
    const spa = container.querySelectorAll('.cx-ui-breadcrumb__item')[0]!;
    expect(spa.tagName).toBe('SPAN');
    expect(spa.getAttribute('role')).toBe('link');
    expect(spa.getAttribute('tabindex')).toBe('0');
    expect(spa.classList.contains('cx-ui-breadcrumb__item--clickable')).toBe(true);
  });

  it('item label text matches', () => {
    const { container } = render(<ChronixBreadcrumb items={SAMPLE_ITEMS} />);
    const itemEls = container.querySelectorAll('.cx-ui-breadcrumb__item');
    expect(itemEls[0]!.textContent).toBe('Home');
    expect(itemEls[1]!.textContent).toBe('Docs');
    expect(itemEls[2]!.textContent).toBe('');
  });
});

describe('ChronixBreadcrumb (react) — separators', () => {
  it('renders items.length - 1 separators', () => {
    const { container } = render(<ChronixBreadcrumb items={SAMPLE_ITEMS} />);
    expect(container.querySelectorAll('.cx-ui-breadcrumb__separator')).toHaveLength(2);
  });

  it('renders 0 separators when items has only 1 entry', () => {
    const items: BreadcrumbItem[] = [
      { key: 'one', label: 'Only', href: undefined, clickable: false },
    ];
    const { container } = render(<ChronixBreadcrumb items={items} />);
    expect(container.querySelectorAll('.cx-ui-breadcrumb__separator')).toHaveLength(0);
  });

  it('separator text matches default "/"', () => {
    const { container } = render(<ChronixBreadcrumb items={SAMPLE_ITEMS} />);
    expect(container.querySelectorAll('.cx-ui-breadcrumb__separator')[0]!.textContent).toBe('/');
  });

  it('custom separator string overrides default', () => {
    const { container } = render(<ChronixBreadcrumb items={SAMPLE_ITEMS} separator=">" />);
    expect(container.querySelectorAll('.cx-ui-breadcrumb__separator')[0]!.textContent).toBe('>');
    expect(
      container
        .querySelector('nav.cx-ui-breadcrumb')!
        .classList.contains('cx-ui-breadcrumb--custom-separator'),
    ).toBe(true);
  });

  it('separatorNode prop overrides separator string and suppresses --custom-separator class', () => {
    const { container } = render(
      <ChronixBreadcrumb
        items={SAMPLE_ITEMS}
        separator=">"
        separatorNode={<svg className="custom-sep" />}
      />,
    );
    expect(container.querySelectorAll('.cx-ui-breadcrumb__separator .custom-sep')).toHaveLength(2);
    expect(
      container
        .querySelector('nav.cx-ui-breadcrumb')!
        .classList.contains('cx-ui-breadcrumb--custom-separator'),
    ).toBe(false);
  });
});

describe('ChronixBreadcrumb (react) — onItemClick callback', () => {
  it('fires onItemClick for href items', () => {
    const onItemClick = vi.fn();
    const { container } = render(
      <ChronixBreadcrumb items={SAMPLE_ITEMS} onItemClick={onItemClick} />,
    );
    const homeItem = container.querySelectorAll('.cx-ui-breadcrumb__item')[0]!;
    fireEvent.click(homeItem);
    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect((onItemClick.mock.calls[0]![0] as { key: string }).key).toBe('home');
  });

  it('fires onItemClick for clickable-without-href items', () => {
    const items: BreadcrumbItem[] = [
      { key: 'spa', label: 'SPA', href: undefined, clickable: true },
      { key: 'last', label: 'Last', href: undefined, clickable: false },
    ];
    const onItemClick = vi.fn();
    const { container } = render(<ChronixBreadcrumb items={items} onItemClick={onItemClick} />);
    fireEvent.click(container.querySelectorAll('.cx-ui-breadcrumb__item')[0]!);
    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect((onItemClick.mock.calls[0]![0] as { key: string }).key).toBe('spa');
  });

  it('does NOT fire onItemClick for non-clickable items', () => {
    const onItemClick = vi.fn();
    const { container } = render(
      <ChronixBreadcrumb items={SAMPLE_ITEMS} onItemClick={onItemClick} />,
    );
    fireEvent.click(container.querySelectorAll('.cx-ui-breadcrumb__item')[2]!);
    expect(onItemClick).not.toHaveBeenCalled();
  });
});

describe('ChronixBreadcrumb (react) — CSS injection', () => {
  it('mounting ensures the chronix-breadcrumb stylesheet is in document.head', () => {
    render(<ChronixBreadcrumb items={SAMPLE_ITEMS} />);
    expect(document.head.querySelector('style[data-chronix-ui="breadcrumb"]')).not.toBeNull();
  });
});
