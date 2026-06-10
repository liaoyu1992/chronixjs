import { describe, expect, it } from 'vitest';

import { defaultCodeProps, type CodeProps } from './code-spec.js';

describe('defaultCodeProps', () => {
  it('matches defaults', () => {
    expect(defaultCodeProps).toEqual({ value: '', inline: false });
  });

  it('is spreadable', () => {
    const props: CodeProps = { ...defaultCodeProps, value: 'console.log(1);', inline: true };
    expect(props.value).toBe('console.log(1);');
    expect(props.inline).toBe(true);
  });
});
