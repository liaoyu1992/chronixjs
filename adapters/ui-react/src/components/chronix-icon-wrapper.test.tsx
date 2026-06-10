import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixIconWrapper } from './chronix-icon-wrapper.js';

describe('ChronixIconWrapper (react)', () => {
  it('renders <span> base + width/height inline style', () => {
    const { container } = render(<ChronixIconWrapper size={32} />);
    const root = container.querySelector<HTMLElement>('.cx-ui-icon-wrapper')!;
    expect(root.tagName).toBe('SPAN');
    expect(root.style.width).toBe('32px');
    expect(root.style.height).toBe('32px');
  });

  it('sets inline color when color prop is defined', () => {
    const { container } = render(<ChronixIconWrapper color="#ff0000" />);
    const root = container.querySelector<HTMLElement>('.cx-ui-icon-wrapper')!;
    expect(root.style.color.toLowerCase()).toMatch(/#ff0000|rgb\(255,\s*0,\s*0\)/);
  });

  it('renders children', () => {
    const { container } = render(
      <ChronixIconWrapper>
        <svg className="x" />
      </ChronixIconWrapper>,
    );
    expect(container.querySelector('.x')).not.toBeNull();
  });

  it('injects the stylesheet', () => {
    render(<ChronixIconWrapper />);
    expect(document.head.querySelector('style[data-chronix-ui="icon-wrapper"]')).not.toBeNull();
  });
});
