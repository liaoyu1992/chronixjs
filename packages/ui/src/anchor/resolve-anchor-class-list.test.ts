import { describe, expect, it } from 'vitest';

import { resolveAnchorClassList } from './resolve-anchor-class-list.js';

describe('resolveAnchorClassList', () => {
  it('returns base + both modifiers by default', () => {
    expect(resolveAnchorClassList({})).toEqual([
      'cx-ui-anchor',
      'cx-ui-anchor--show-rail',
      'cx-ui-anchor--show-background',
    ]);
  });

  it('omits --show-rail when showRail is false', () => {
    const result = resolveAnchorClassList({ showRail: false });
    expect(result).toEqual(['cx-ui-anchor', 'cx-ui-anchor--show-background']);
  });

  it('omits --show-background when showBackground is false', () => {
    const result = resolveAnchorClassList({ showBackground: false });
    expect(result).toEqual(['cx-ui-anchor', 'cx-ui-anchor--show-rail']);
  });

  it('omits both modifiers when both are false', () => {
    const result = resolveAnchorClassList({ showRail: false, showBackground: false });
    expect(result).toEqual(['cx-ui-anchor']);
  });

  it('includes both modifiers when both are true', () => {
    const result = resolveAnchorClassList({ showRail: true, showBackground: true });
    expect(result).toEqual([
      'cx-ui-anchor',
      'cx-ui-anchor--show-rail',
      'cx-ui-anchor--show-background',
    ]);
  });
});
