import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixHeatmap } from './chronix-heatmap.js';

const CELLS: readonly (readonly number[])[] = [
  [0, 5, 10],
  [3, 6, 9],
];

describe('ChronixHeatmap (react)', () => {
  it('renders <svg> base', () => {
    const { container } = render(<ChronixHeatmap cells={CELLS} cellSize={20} />);
    const svg = container.querySelector('svg.cx-ui-heatmap')!;
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  it('renders one <rect> per cell + correct svg dimensions', () => {
    const { container } = render(<ChronixHeatmap cells={CELLS} cellSize={20} />);
    expect(container.querySelectorAll('rect.cx-ui-heatmap__cell').length).toBe(6);
    const svg = container.querySelector('svg.cx-ui-heatmap')!;
    expect(svg.getAttribute('width')).toBe('60');
    expect(svg.getAttribute('height')).toBe('40');
  });

  it('renders empty for empty cells', () => {
    const { container } = render(<ChronixHeatmap />);
    expect(container.querySelectorAll('rect').length).toBe(0);
  });

  it('injects the stylesheet', () => {
    render(<ChronixHeatmap cells={CELLS} />);
    expect(document.head.querySelector('style[data-chronix-ui="heatmap"]')).not.toBeNull();
  });
});
