import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixButtonGroup } from './chronix-button-group.js';

describe('ChronixButtonGroup (react)', () => {
  it('renders <div role="group"> + base + --horizontal default', () => {
    const { container } = render(<ChronixButtonGroup />);
    const root = container.querySelector('div.cx-ui-button-group')!;
    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('role')).toBe('group');
    expect(root.classList.contains('cx-ui-button-group--horizontal')).toBe(true);
  });

  it('adds --vertical when vertical', () => {
    const { container } = render(<ChronixButtonGroup vertical />);
    expect(
      container
        .querySelector('div.cx-ui-button-group')!
        .classList.contains('cx-ui-button-group--vertical'),
    ).toBe(true);
  });

  it('renders children', () => {
    const { container } = render(
      <ChronixButtonGroup>
        <button className="b">A</button>
        <button className="b">B</button>
      </ChronixButtonGroup>,
    );
    expect(container.querySelectorAll('.b').length).toBe(2);
  });

  it('injects the stylesheet', () => {
    render(<ChronixButtonGroup />);
    expect(document.head.querySelector('style[data-chronix-ui="button-group"]')).not.toBeNull();
  });
});
