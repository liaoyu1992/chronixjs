import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixHeatmap } from './chronix-heatmap.js';

const CELLS: readonly (readonly number[])[] = [
  [0, 5, 10],
  [3, 6, 9],
];

describe('ChronixHeatmap (vue3)', () => {
  it('renders an <svg> root with base class', () => {
    const wrapper = mount(ChronixHeatmap, { props: { cells: CELLS, cellSize: 20 } });
    expect((wrapper.element as HTMLElement).tagName.toLowerCase()).toBe('svg');
    expect(wrapper.classes()).toContain('cx-ui-heatmap');
  });

  it('renders one <rect> per cell with width × cellSize', () => {
    const wrapper = mount(ChronixHeatmap, { props: { cells: CELLS, cellSize: 20 } });
    const rects = wrapper.findAll('rect.cx-ui-heatmap__cell');
    expect(rects).toHaveLength(6);
    expect(wrapper.attributes('width')).toBe('60');
    expect(wrapper.attributes('height')).toBe('40');
  });

  it('renders empty SVG for empty cells', () => {
    const wrapper = mount(ChronixHeatmap, { props: { cells: [] } });
    expect(wrapper.findAll('rect')).toHaveLength(0);
  });

  it('injects the chronix-heatmap stylesheet', () => {
    mount(ChronixHeatmap, { props: { cells: CELLS } });
    expect(document.head.querySelector('style[data-chronix-ui="heatmap"]')).not.toBeNull();
  });
});
