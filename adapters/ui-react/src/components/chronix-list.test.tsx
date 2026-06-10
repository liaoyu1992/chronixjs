import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixList } from './chronix-list.js';

import type { ListItem } from '@chronixjs/ui';

const RICH_ITEMS: ListItem[] = [
  {
    key: 'docs',
    title: 'Documents',
    description: '14 items',
    prefix: '📁',
    suffix: '→',
  },
  {
    key: 'photos',
    title: 'Photos',
    description: undefined,
    prefix: '📷',
    suffix: undefined,
  },
  {
    key: 'plain',
    title: 'Plain row',
    description: undefined,
    prefix: undefined,
    suffix: undefined,
  },
];

describe('ChronixList (react) — root rendering', () => {
  it('renders a <ul> with the base class + size + with-divider modifiers', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} />);
    const root = container.querySelector('ul.cx-ui-list')!;
    expect(root.tagName).toBe('UL');
    expect(root.classList.contains('cx-ui-list--medium')).toBe(true);
    expect(root.classList.contains('cx-ui-list--with-divider')).toBe(true);
  });

  it('renders empty <ul> when items is empty', () => {
    const { container } = render(<ChronixList />);
    expect(container.querySelectorAll('.cx-ui-list__item')).toHaveLength(0);
  });

  it('adds --bordered when bordered=true', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} bordered />);
    expect(
      container.querySelector('ul.cx-ui-list')!.classList.contains('cx-ui-list--bordered'),
    ).toBe(true);
  });

  it('adds --hoverable when hoverable=true', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} hoverable />);
    expect(
      container.querySelector('ul.cx-ui-list')!.classList.contains('cx-ui-list--hoverable'),
    ).toBe(true);
  });

  it('omits --with-divider when showDivider={false}', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} showDivider={false} />);
    expect(
      container.querySelector('ul.cx-ui-list')!.classList.contains('cx-ui-list--with-divider'),
    ).toBe(false);
  });
});

describe('ChronixList (react) — items', () => {
  it('renders one <li> per ListItem', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} />);
    expect(container.querySelectorAll('.cx-ui-list__item')).toHaveLength(RICH_ITEMS.length);
  });

  it('renders __prefix only when item.prefix is defined', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-list__item');
    expect(items[0]!.querySelector('.cx-ui-list__prefix')).not.toBeNull();
    expect(items[0]!.querySelector('.cx-ui-list__prefix')!.textContent).toBe('📁');
    expect(items[1]!.querySelector('.cx-ui-list__prefix')).not.toBeNull();
    expect(items[2]!.querySelector('.cx-ui-list__prefix')).toBeNull();
  });

  it('renders __suffix only when item.suffix is defined', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-list__item');
    expect(items[0]!.querySelector('.cx-ui-list__suffix')).not.toBeNull();
    expect(items[0]!.querySelector('.cx-ui-list__suffix')!.textContent).toBe('→');
    expect(items[1]!.querySelector('.cx-ui-list__suffix')).toBeNull();
    expect(items[2]!.querySelector('.cx-ui-list__suffix')).toBeNull();
  });

  it('renders __description only when item.description is defined', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-list__item');
    expect(items[0]!.querySelector('.cx-ui-list__description')!.textContent).toBe('14 items');
    expect(items[1]!.querySelector('.cx-ui-list__description')).toBeNull();
    expect(items[2]!.querySelector('.cx-ui-list__description')).toBeNull();
  });

  it('renders __title text for every item', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} />);
    const titles = container.querySelectorAll('.cx-ui-list__title');
    expect(titles[0]!.textContent).toBe('Documents');
    expect(titles[1]!.textContent).toBe('Photos');
    expect(titles[2]!.textContent).toBe('Plain row');
  });
});

describe('ChronixList (react) — per-item modifiers', () => {
  it('item with prefix carries --with-prefix modifier', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-list__item');
    expect(items[0]!.classList.contains('cx-ui-list__item--with-prefix')).toBe(true);
    expect(items[2]!.classList.contains('cx-ui-list__item--with-prefix')).toBe(false);
  });

  it('item with suffix carries --with-suffix modifier', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-list__item');
    expect(items[0]!.classList.contains('cx-ui-list__item--with-suffix')).toBe(true);
    expect(items[1]!.classList.contains('cx-ui-list__item--with-suffix')).toBe(false);
  });

  it('item with description carries --with-description modifier', () => {
    const { container } = render(<ChronixList items={RICH_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-list__item');
    expect(items[0]!.classList.contains('cx-ui-list__item--with-description')).toBe(true);
    expect(items[2]!.classList.contains('cx-ui-list__item--with-description')).toBe(false);
  });
});

describe('ChronixList (react) — CSS injection', () => {
  it('mounting ensures the chronix-list stylesheet is in document.head', () => {
    render(<ChronixList items={RICH_ITEMS} />);
    expect(document.head.querySelector('style[data-chronix-ui="list"]')).not.toBeNull();
  });
});
