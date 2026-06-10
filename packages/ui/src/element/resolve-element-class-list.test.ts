import { describe, expect, it } from 'vitest';

import { defaultElementProps, type ElementProps } from './element-spec.js';
import { resolveElementClassList } from './resolve-element-class-list.js';

function props(over: Partial<ElementProps> = {}): ElementProps {
  return { ...defaultElementProps, ...over };
}

describe('resolveElementClassList', () => {
  it('returns base only for default props', () => {
    expect(resolveElementClassList(props())).toEqual(['cx-ui-element']);
  });

  it('adds --inline when inline=true', () => {
    expect(resolveElementClassList(props({ inline: true }))).toContain('cx-ui-element--inline');
  });

  it('returns a fresh array per call', () => {
    expect(resolveElementClassList(props())).not.toBe(resolveElementClassList(props()));
  });
});
