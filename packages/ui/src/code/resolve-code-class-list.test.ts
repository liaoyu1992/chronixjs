import { describe, expect, it } from 'vitest';

import { defaultCodeProps, type CodeProps } from './code-spec.js';
import { resolveCodeClassList } from './resolve-code-class-list.js';

function props(over: Partial<CodeProps> = {}): CodeProps {
  return { ...defaultCodeProps, ...over };
}

describe('resolveCodeClassList', () => {
  it('returns base + --block for default props', () => {
    expect(resolveCodeClassList(props())).toEqual(['cx-ui-code', 'cx-ui-code--block']);
  });

  it('returns base + --inline when inline=true', () => {
    expect(resolveCodeClassList(props({ inline: true }))).toEqual([
      'cx-ui-code',
      'cx-ui-code--inline',
    ]);
  });
});
