import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixCard } from './chronix-card.js';

describe('ChronixCard (react) — default rendering', () => {
  it('renders a <div> with base + medium + bordered classes', () => {
    const { container } = render(<ChronixCard />);
    const root = container.querySelector('div.cx-ui-card')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-card--medium')).toBe(true);
    expect(root.classList.contains('cx-ui-card--bordered')).toBe(true);
  });

  it('renders children inside __content', () => {
    const { container } = render(<ChronixCard>Body</ChronixCard>);
    expect(container.querySelector('.cx-ui-card__content')!.textContent).toBe('Body');
  });
});

describe('ChronixCard (react) — title + footer prop', () => {
  it('renders __header when title is set + adds --with-title', () => {
    const { container } = render(<ChronixCard title="Stats" />);
    expect(
      container.querySelector('div.cx-ui-card')!.classList.contains('cx-ui-card--with-title'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-card__header')!.textContent).toBe('Stats');
  });

  it('renders __footer when footer prop supplied + adds --with-footer', () => {
    const { container } = render(<ChronixCard footer={<span>Footer content</span>} />);
    expect(
      container.querySelector('div.cx-ui-card')!.classList.contains('cx-ui-card--with-footer'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-card__footer')!.textContent).toBe('Footer content');
  });

  it('omits __footer + --with-footer when footer prop is undefined', () => {
    const { container } = render(<ChronixCard />);
    expect(container.querySelector('.cx-ui-card__footer')).toBeNull();
    expect(
      container.querySelector('div.cx-ui-card')!.classList.contains('cx-ui-card--with-footer'),
    ).toBe(false);
  });
});

describe('ChronixCard (react) — size + modifiers', () => {
  it.each(['small', 'medium', 'large'] as const)('size="%s" adds the matching modifier', (s) => {
    const { container } = render(<ChronixCard size={s} />);
    expect(container.querySelector('div.cx-ui-card')!.classList.contains(`cx-ui-card--${s}`)).toBe(
      true,
    );
  });

  it('bordered={false} removes --bordered', () => {
    const { container } = render(<ChronixCard bordered={false} />);
    expect(
      container.querySelector('div.cx-ui-card')!.classList.contains('cx-ui-card--bordered'),
    ).toBe(false);
  });

  it('hoverable + embedded add their modifiers', () => {
    const { container } = render(<ChronixCard hoverable embedded />);
    expect(
      container.querySelector('div.cx-ui-card')!.classList.contains('cx-ui-card--hoverable'),
    ).toBe(true);
    expect(
      container.querySelector('div.cx-ui-card')!.classList.contains('cx-ui-card--embedded'),
    ).toBe(true);
  });
});

describe('ChronixCard (react) — CSS injection', () => {
  it('mounting a card ensures the chronix-card stylesheet is in document.head', () => {
    render(<ChronixCard />);
    expect(document.head.querySelector('style[data-chronix-ui="card"]')).not.toBeNull();
  });
});
