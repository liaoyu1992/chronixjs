import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixThing } from './chronix-thing.js';

describe('ChronixThing (react) — root rendering', () => {
  it('renders a <div> with only the base class when no slots/props supplied', () => {
    const { container } = render(<ChronixThing />);
    const root = container.querySelector('div.cx-ui-thing')!;
    expect(root.tagName).toBe('DIV');
    expect(Array.from(root.classList)).toEqual(['cx-ui-thing']);
  });

  it('renders the __main container even when no slots resolve to content', () => {
    const { container } = render(<ChronixThing />);
    expect(container.querySelector('.cx-ui-thing__main')).not.toBeNull();
  });
});

describe('ChronixThing (react) — string-prop driven header / description', () => {
  it('adds --with-header + __header-content text from title prop', () => {
    const { container } = render(<ChronixThing title="Project A" />);
    const root = container.querySelector('div.cx-ui-thing')!;
    expect(root.classList.contains('cx-ui-thing--with-header')).toBe(true);
    expect(container.querySelector('.cx-ui-thing__header-content')!.textContent).toBe('Project A');
  });

  it('adds --with-description + __description text from description prop', () => {
    const { container } = render(<ChronixThing description="Sub-text" />);
    const root = container.querySelector('div.cx-ui-thing')!;
    expect(root.classList.contains('cx-ui-thing--with-description')).toBe(true);
    expect(container.querySelector('.cx-ui-thing__description')!.textContent).toBe('Sub-text');
  });

  it('omits header/description elements when neither prop nor node provided', () => {
    const { container } = render(<ChronixThing />);
    expect(container.querySelector('.cx-ui-thing__header')).toBeNull();
    expect(container.querySelector('.cx-ui-thing__description')).toBeNull();
  });
});

describe('ChronixThing (react) — node-driven sections', () => {
  it('adds --with-avatar + __avatar element when avatar is provided', () => {
    const { container } = render(<ChronixThing avatar={<div className="my-avatar">A</div>} />);
    const root = container.querySelector('div.cx-ui-thing')!;
    expect(root.classList.contains('cx-ui-thing--with-avatar')).toBe(true);
    expect(container.querySelector('.cx-ui-thing__avatar .my-avatar')).not.toBeNull();
  });

  it('adds --with-header-extra + __header-extra element when headerExtra is provided', () => {
    const { container } = render(
      <ChronixThing title="Heading" headerExtra={<span className="ext">extra</span>} />,
    );
    const root = container.querySelector('div.cx-ui-thing')!;
    expect(root.classList.contains('cx-ui-thing--with-header-extra')).toBe(true);
    expect(container.querySelector('.cx-ui-thing__header-extra .ext')).not.toBeNull();
  });

  it('adds --with-content + __content element when children are provided', () => {
    const { container } = render(
      <ChronixThing>
        <p className="body">body</p>
      </ChronixThing>,
    );
    const root = container.querySelector('div.cx-ui-thing')!;
    expect(root.classList.contains('cx-ui-thing--with-content')).toBe(true);
    expect(container.querySelector('.cx-ui-thing__content .body')).not.toBeNull();
  });

  it('adds --with-action + __action element when action is provided', () => {
    const { container } = render(<ChronixThing action={<button className="ok">OK</button>} />);
    const root = container.querySelector('div.cx-ui-thing')!;
    expect(root.classList.contains('cx-ui-thing--with-action')).toBe(true);
    expect(container.querySelector('.cx-ui-thing__action .ok')).not.toBeNull();
  });

  it('adds --with-footer + __footer element when footer is provided', () => {
    const { container } = render(<ChronixThing footer={<small className="foot">foot</small>} />);
    const root = container.querySelector('div.cx-ui-thing')!;
    expect(root.classList.contains('cx-ui-thing--with-footer')).toBe(true);
    expect(container.querySelector('.cx-ui-thing__footer .foot')).not.toBeNull();
  });

  it('overrides title with headerNode when both supplied', () => {
    const { container } = render(
      <ChronixThing title="Prop title" headerNode={<span className="rich">Rich heading</span>} />,
    );
    expect(container.querySelector('.cx-ui-thing__header-content .rich')).not.toBeNull();
    expect(container.querySelector('.cx-ui-thing__header-content')!.textContent).toBe(
      'Rich heading',
    );
  });
});

describe('ChronixThing (react) — content-indented modifier', () => {
  it('adds --content-indented modifier when contentIndented=true', () => {
    const { container } = render(<ChronixThing title="A" contentIndented />);
    expect(
      container
        .querySelector('div.cx-ui-thing')!
        .classList.contains('cx-ui-thing--content-indented'),
    ).toBe(true);
  });

  it('omits --content-indented modifier when contentIndented=false (default)', () => {
    const { container } = render(<ChronixThing title="A" />);
    expect(
      container
        .querySelector('div.cx-ui-thing')!
        .classList.contains('cx-ui-thing--content-indented'),
    ).toBe(false);
  });
});

describe('ChronixThing (react) — CSS injection', () => {
  it('mounting ensures the chronix-thing stylesheet is in document.head', () => {
    render(<ChronixThing />);
    expect(document.head.querySelector('style[data-chronix-ui="thing"]')).not.toBeNull();
  });
});
