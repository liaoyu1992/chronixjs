import { describe, expect, it } from 'vitest';

import { defaultHeatmapProps } from './heatmap-spec.js';
import { resolveHeatmapClassList } from './resolve-heatmap-class-list.js';

describe('resolveHeatmapClassList', () => {
  it('returns base class', () => {
    expect(resolveHeatmapClassList(defaultHeatmapProps)).toEqual(['cx-ui-heatmap']);
  });
});
