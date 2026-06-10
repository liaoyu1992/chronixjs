import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixDescriptions } from './chronix-descriptions.js';

import type { DescriptionItem } from '@chronixjs/ui';

const PROFILE_ITEMS: DescriptionItem[] = [
  { key: 'name', label: 'Name', value: 'Liao Yu', span: 1 },
  { key: 'email', label: 'Email', value: 'liao@chronix.dev', span: 1 },
  { key: 'role', label: 'Role', value: 'Engineer', span: 1 },
  { key: 'bio', label: 'Bio', value: 'Spans the full row.', span: 3 },
];

describe('ChronixDescriptions (react) — root rendering', () => {
  it('renders a <div> with the base class + size + placement modifiers', () => {
    const { container } = render(<ChronixDescriptions items={PROFILE_ITEMS} columns={3} />);
    const root = container.querySelector('div.cx-ui-descriptions')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-descriptions--medium')).toBe(true);
    expect(root.classList.contains('cx-ui-descriptions--placement-left')).toBe(true);
  });

  it('adds --bordered when bordered=true', () => {
    const { container } = render(<ChronixDescriptions items={PROFILE_ITEMS} bordered />);
    expect(
      container
        .querySelector('div.cx-ui-descriptions')!
        .classList.contains('cx-ui-descriptions--bordered'),
    ).toBe(true);
  });

  it('adds --placement-top when labelPlacement="top"', () => {
    const { container } = render(
      <ChronixDescriptions items={PROFILE_ITEMS} labelPlacement="top" />,
    );
    expect(
      container
        .querySelector('div.cx-ui-descriptions')!
        .classList.contains('cx-ui-descriptions--placement-top'),
    ).toBe(true);
  });

  it('renders empty grid when items is empty', () => {
    const { container } = render(<ChronixDescriptions />);
    expect(container.querySelectorAll('.cx-ui-descriptions__item')).toHaveLength(0);
  });
});

describe('ChronixDescriptions (react) — title', () => {
  it('renders __title with prop string', () => {
    const { container } = render(<ChronixDescriptions items={PROFILE_ITEMS} title="Profile" />);
    expect(container.querySelector('.cx-ui-descriptions__title')!.textContent).toBe('Profile');
    expect(
      container
        .querySelector('div.cx-ui-descriptions')!
        .classList.contains('cx-ui-descriptions--with-title'),
    ).toBe(true);
  });

  it('omits __title when no title prop + no titleNode', () => {
    const { container } = render(<ChronixDescriptions items={PROFILE_ITEMS} />);
    expect(container.querySelector('.cx-ui-descriptions__title')).toBeNull();
    expect(
      container
        .querySelector('div.cx-ui-descriptions')!
        .classList.contains('cx-ui-descriptions--with-title'),
    ).toBe(false);
  });

  it('renders __title from titleNode when supplied (overrides title prop)', () => {
    const { container } = render(
      <ChronixDescriptions
        items={PROFILE_ITEMS}
        title="Ignored"
        titleNode={<strong>Slot title</strong>}
      />,
    );
    expect(container.querySelector('.cx-ui-descriptions__title')!.textContent).toBe('Slot title');
  });
});

describe('ChronixDescriptions (react) — items', () => {
  it('renders one __item per DescriptionItem', () => {
    const { container } = render(<ChronixDescriptions items={PROFILE_ITEMS} columns={3} />);
    expect(container.querySelectorAll('.cx-ui-descriptions__item')).toHaveLength(
      PROFILE_ITEMS.length,
    );
  });

  it('renders __label and __value text for every item', () => {
    const { container } = render(<ChronixDescriptions items={PROFILE_ITEMS} columns={3} />);
    const labels = container.querySelectorAll('.cx-ui-descriptions__label');
    const values = container.querySelectorAll('.cx-ui-descriptions__value');
    expect(labels[0]!.textContent).toBe('Name');
    expect(values[0]!.textContent).toBe('Liao Yu');
    expect(labels[3]!.textContent).toBe('Bio');
    expect(values[3]!.textContent).toBe('Spans the full row.');
  });

  it('renders the __grid with grid-template-columns inline style', () => {
    const { container } = render(<ChronixDescriptions items={PROFILE_ITEMS} columns={3} />);
    const grid = container.querySelector('.cx-ui-descriptions__grid')!;
    const style = grid.getAttribute('style') ?? '';
    expect(style).toContain('grid-template-columns');
    expect(style).toContain('repeat(3,');
  });
});

describe('ChronixDescriptions (react) — per-item span', () => {
  it('emits grid-column inline style for items with span > 1', () => {
    const { container } = render(<ChronixDescriptions items={PROFILE_ITEMS} columns={3} />);
    const items = container.querySelectorAll('.cx-ui-descriptions__item');
    const lastStyle = items[3]!.getAttribute('style') ?? '';
    expect(lastStyle).toContain('grid-column');
    expect(lastStyle).toContain('span 3');
  });

  it('omits grid-column inline style for items with span === 1', () => {
    const { container } = render(<ChronixDescriptions items={PROFILE_ITEMS} columns={3} />);
    const items = container.querySelectorAll('.cx-ui-descriptions__item');
    const firstStyle = items[0]!.getAttribute('style') ?? '';
    expect(firstStyle).not.toContain('grid-column');
  });

  it('omits grid-column inline style when item.span > columns (silent ignore)', () => {
    const items: DescriptionItem[] = [{ key: 'a', label: 'A', value: 'A', span: 99 }];
    const { container } = render(<ChronixDescriptions items={items} columns={3} />);
    const style = container.querySelector('.cx-ui-descriptions__item')!.getAttribute('style') ?? '';
    expect(style).not.toContain('grid-column');
  });
});

describe('ChronixDescriptions (react) — CSS injection', () => {
  it('mounting ensures the chronix-descriptions stylesheet is in document.head', () => {
    render(<ChronixDescriptions items={PROFILE_ITEMS} />);
    expect(document.head.querySelector('style[data-chronix-ui="descriptions"]')).not.toBeNull();
  });
});
