import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixEquation } from './chronix-equation.js';

describe('ChronixEquation (react)', () => {
  it('renders <math> root with --inline default', () => {
    const { container } = render(<ChronixEquation value="<mrow><mi>x</mi></mrow>" />);
    const root = container.querySelector('.cx-ui-equation')!;
    expect(root.tagName.toLowerCase()).toBe('math');
    expect(root.classList.contains('cx-ui-equation--inline')).toBe(true);
    expect(root.getAttribute('display')).toBe('inline');
  });

  it('renders --block for display=block', () => {
    const { container } = render(<ChronixEquation value="<mrow></mrow>" display="block" />);
    const root = container.querySelector('.cx-ui-equation')!;
    expect(root.classList.contains('cx-ui-equation--block')).toBe(true);
  });

  it('injects MathML via innerHTML', () => {
    const { container } = render(<ChronixEquation value="<mrow><mi>x</mi></mrow>" />);
    expect(container.querySelector('.cx-ui-equation')!.innerHTML.toLowerCase()).toContain('mi');
  });

  it('injects the stylesheet', () => {
    render(<ChronixEquation />);
    expect(document.head.querySelector('style[data-chronix-ui="equation"]')).not.toBeNull();
  });
});
