import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixHeatmap } from './chronix-heatmap.js';

const C = ChronixHeatmap as unknown as VueConstructor;

const CELLS: readonly (readonly number[])[] = [
  [0, 5, 10],
  [3, 6, 9],
];

describe('ChronixHeatmap (vue2)', () => {
  it('renders <svg> base class', () => {
    const wrapper = mount(C, { propsData: { cells: CELLS, cellSize: 20 } });
    expect(wrapper.element.tagName.toLowerCase()).toBe('svg');
    expect(wrapper.classes()).toContain('cx-ui-heatmap');
  });

  it('renders one <rect> per cell + correct svg dimensions', () => {
    const wrapper = mount(C, { propsData: { cells: CELLS, cellSize: 20 } });
    expect(wrapper.findAll('rect.cx-ui-heatmap__cell')).toHaveLength(6);
    expect(wrapper.attributes('width')).toBe('60');
    expect(wrapper.attributes('height')).toBe('40');
  });

  it('renders empty for empty cells', () => {
    const wrapper = mount(C, { propsData: { cells: [] } });
    expect(wrapper.findAll('rect')).toHaveLength(0);
  });

  it('injects the stylesheet', () => {
    mount(C, { propsData: { cells: CELLS } });
    expect(document.head.querySelector('style[data-chronix-ui="heatmap"]')).not.toBeNull();
  });
});
