import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixGradientText } from './chronix-gradient-text.js';

describe('ChronixGradientText (react)', () => {
  it('renders <span> base + linear-gradient background', () => {
    const { container } = render(<ChronixGradientText value="rainbow" />);
    const root = container.querySelector<HTMLElement>('.cx-ui-gradient-text')!;
    expect(root.tagName).toBe('SPAN');
    expect(root.style.background).toContain('linear-gradient');
    expect(root.textContent).toBe('rainbow');
  });

  it('honors custom colors + direction', () => {
    const { container } = render(
      <ChronixGradientText value="x" colors={['#ff0000', '#0000ff']} direction={45} />,
    );
    const bg = container
      .querySelector<HTMLElement>('.cx-ui-gradient-text')!
      .style.background.toLowerCase();
    expect(bg).toContain('45deg');
    expect(bg).toMatch(/#ff0000|rgb\(255,\s*0,\s*0\)/);
    expect(bg).toMatch(/#0000ff|rgb\(0,\s*0,\s*255\)/);
  });

  it('injects the stylesheet', () => {
    render(<ChronixGradientText />);
    expect(document.head.querySelector('style[data-chronix-ui="gradient-text"]')).not.toBeNull();
  });
});
