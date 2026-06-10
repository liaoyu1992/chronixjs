import { describe, expect, it } from 'vitest';

import { resolveDescriptionsGridTemplateColumns } from './resolve-descriptions-grid-template-columns.js';

describe('resolveDescriptionsGridTemplateColumns', () => {
  it('returns repeat(1, minmax(0, 1fr)) for 1 column', () => {
    expect(resolveDescriptionsGridTemplateColumns(1)).toBe('repeat(1, minmax(0, 1fr))');
  });

  it('returns repeat(3, minmax(0, 1fr)) for the default 3 columns', () => {
    expect(resolveDescriptionsGridTemplateColumns(3)).toBe('repeat(3, minmax(0, 1fr))');
  });

  it('returns repeat(12, minmax(0, 1fr)) for 12 columns', () => {
    expect(resolveDescriptionsGridTemplateColumns(12)).toBe('repeat(12, minmax(0, 1fr))');
  });

  it('embeds the numeric value into the repeat() expression verbatim', () => {
    for (const cols of [2, 4, 6, 8, 24] as const) {
      expect(resolveDescriptionsGridTemplateColumns(cols)).toContain(`repeat(${cols}`);
    }
  });
});
