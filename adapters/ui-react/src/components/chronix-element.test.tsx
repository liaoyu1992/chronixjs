import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixElement } from './chronix-element.js';

describe('ChronixElement (react)', () => {
  it('renders <span> by default', () => {
    const { container } = render(<ChronixElement>hi</ChronixElement>);
    const root = container.querySelector('.cx-ui-element')!;
    expect(root.tagName).toBe('SPAN');
  });

  it('honors custom tag prop', () => {
    const { container } = render(<ChronixElement tag="section">body</ChronixElement>);
    expect(container.querySelector('.cx-ui-element')!.tagName).toBe('SECTION');
  });

  it('adds --inline when inline=true', () => {
    const { container } = render(<ChronixElement inline>x</ChronixElement>);
    expect(
      container.querySelector('.cx-ui-element')!.classList.contains('cx-ui-element--inline'),
    ).toBe(true);
  });

  it('injects the stylesheet', () => {
    render(<ChronixElement />);
    expect(document.head.querySelector('style[data-chronix-ui="element"]')).not.toBeNull();
  });
});
