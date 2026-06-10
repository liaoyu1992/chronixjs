import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChronixPageHeader } from './chronix-page-header.js';

describe('ChronixPageHeader (react) — default rendering', () => {
  it('renders a <div> with the base class', () => {
    const { container } = render(<ChronixPageHeader />);
    const root = container.querySelector('div.cx-ui-page-header')!;
    expect(root.tagName).toBe('DIV');
  });

  it('omits __title / __subtitle / __back-button / __extra / __footer / __content by default', () => {
    const { container } = render(<ChronixPageHeader />);
    expect(container.querySelector('.cx-ui-page-header__title')).toBeNull();
    expect(container.querySelector('.cx-ui-page-header__subtitle')).toBeNull();
    expect(container.querySelector('.cx-ui-page-header__back-button')).toBeNull();
    expect(container.querySelector('.cx-ui-page-header__extra')).toBeNull();
    expect(container.querySelector('.cx-ui-page-header__footer')).toBeNull();
    expect(container.querySelector('.cx-ui-page-header__content')).toBeNull();
  });
});

describe('ChronixPageHeader (react) — title / subtitle props', () => {
  it('renders __title + --with-title when title prop is supplied', () => {
    const { container } = render(<ChronixPageHeader title="Project A" />);
    expect(
      container
        .querySelector('div.cx-ui-page-header')!
        .classList.contains('cx-ui-page-header--with-title'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-page-header__title')!.textContent).toBe('Project A');
  });

  it('renders __subtitle + --with-subtitle when subtitle prop is supplied', () => {
    const { container } = render(<ChronixPageHeader subtitle="Owned by you" />);
    expect(
      container
        .querySelector('div.cx-ui-page-header')!
        .classList.contains('cx-ui-page-header--with-subtitle'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-page-header__subtitle')!.textContent).toBe(
      'Owned by you',
    );
  });

  it('titleNode prop overrides title string', () => {
    const { container } = render(
      <ChronixPageHeader title="Plain" titleNode={<span className="rich">Rich</span>} />,
    );
    expect(container.querySelector('.cx-ui-page-header__title .rich')).not.toBeNull();
    expect(container.querySelector('.cx-ui-page-header__title')!.textContent).toBe('Rich');
  });

  it('subtitleNode prop overrides subtitle string', () => {
    const { container } = render(
      <ChronixPageHeader subtitle="Plain" subtitleNode={<span className="rich">Rich</span>} />,
    );
    expect(container.querySelector('.cx-ui-page-header__subtitle .rich')).not.toBeNull();
  });
});

describe('ChronixPageHeader (react) — back affordance', () => {
  it('renders __back-button + --with-back when back=true', () => {
    const { container } = render(<ChronixPageHeader back />);
    expect(
      container
        .querySelector('div.cx-ui-page-header')!
        .classList.contains('cx-ui-page-header--with-back'),
    ).toBe(true);
    const button = container.querySelector<HTMLButtonElement>('.cx-ui-page-header__back-button')!;
    expect(button).not.toBeNull();
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Back');
    expect(button.textContent).toBe('←');
  });

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    const { container } = render(<ChronixPageHeader back onBack={onBack} />);
    fireEvent.click(container.querySelector('.cx-ui-page-header__back-button')!);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('backIcon prop overrides the unicode placeholder', () => {
    const { container } = render(
      <ChronixPageHeader back backIcon={<span className="custom-back">⟵</span>} />,
    );
    expect(
      container.querySelector('.cx-ui-page-header__back-button .custom-back')!.textContent,
    ).toBe('⟵');
  });
});

describe('ChronixPageHeader (react) — avatar / extra / footer / children', () => {
  it('renders __avatar + --with-avatar when avatar prop is supplied', () => {
    const { container } = render(<ChronixPageHeader avatar={<img className="ava" alt="" />} />);
    expect(
      container
        .querySelector('div.cx-ui-page-header')!
        .classList.contains('cx-ui-page-header--with-avatar'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-page-header__avatar .ava')).not.toBeNull();
  });

  it('renders __extra + --with-extra when extra prop is supplied', () => {
    const { container } = render(
      <ChronixPageHeader extra={<button className="act">Save</button>} />,
    );
    expect(
      container
        .querySelector('div.cx-ui-page-header')!
        .classList.contains('cx-ui-page-header--with-extra'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-page-header__extra .act')!.textContent).toBe('Save');
  });

  it('renders __footer + --with-footer when footer prop is supplied', () => {
    const { container } = render(<ChronixPageHeader footer="Tabs row" />);
    expect(
      container
        .querySelector('div.cx-ui-page-header')!
        .classList.contains('cx-ui-page-header--with-footer'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-page-header__footer')!.textContent).toBe('Tabs row');
  });

  it('renders __content + --with-content when children are supplied', () => {
    const { container } = render(<ChronixPageHeader>Body</ChronixPageHeader>);
    expect(
      container
        .querySelector('div.cx-ui-page-header')!
        .classList.contains('cx-ui-page-header--with-content'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-page-header__content')!.textContent).toBe('Body');
  });
});

describe('ChronixPageHeader (react) — inverted modifier', () => {
  it('applies --inverted class when inverted=true', () => {
    const { container } = render(<ChronixPageHeader inverted />);
    expect(
      container
        .querySelector('div.cx-ui-page-header')!
        .classList.contains('cx-ui-page-header--inverted'),
    ).toBe(true);
  });
});

describe('ChronixPageHeader (react) — CSS injection', () => {
  it('mounting ensures the chronix-page-header stylesheet is in document.head', () => {
    render(<ChronixPageHeader />);
    expect(document.head.querySelector('style[data-chronix-ui="page-header"]')).not.toBeNull();
  });
});
