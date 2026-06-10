import { describe, expect, it } from 'vitest';

import { defaultHighlightProps, type HighlightProps } from './highlight-spec.js';
import { resolveHighlightClassList } from './resolve-highlight-class-list.js';

function props(over: Partial<HighlightProps> = {}): HighlightProps {
  return { ...defaultHighlightProps, ...over };
}

describe('resolveHighlightClassList', () => {
  it('returns base only for default props', () => {
    expect(resolveHighlightClassList(props())).toEqual(['cx-ui-highlight']);
  });

  it('emits --case-sensitive when caseSensitive=true', () => {
    expect(resolveHighlightClassList(props({ caseSensitive: true }))).toEqual([
      'cx-ui-highlight',
      'cx-ui-highlight--case-sensitive',
    ]);
  });
});
