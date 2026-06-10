import { describe, expect, it } from 'vitest';

import { defaultLogProps, type LogProps } from './log-spec.js';

describe('defaultLogProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultLogProps).toEqual({
      lines: [],
      lineNumbers: false,
      loading: false,
      maxHeight: undefined,
      wrapLines: false,
    });
  });

  it('is a LogProps-shape that adapters can spread', () => {
    const override: LogProps = {
      ...defaultLogProps,
      lines: ['line a', 'line b'],
      lineNumbers: true,
      loading: true,
      maxHeight: 240,
      wrapLines: true,
    };
    expect(override.lines).toEqual(['line a', 'line b']);
    expect(override.lineNumbers).toBe(true);
    expect(override.loading).toBe(true);
    expect(override.maxHeight).toBe(240);
    expect(override.wrapLines).toBe(true);
  });
});

describe('LogProps lines array', () => {
  it('accepts an empty lines array', () => {
    const props: LogProps = { ...defaultLogProps, lines: [] };
    expect(props.lines.length).toBe(0);
  });

  it('accepts a multi-line array of arbitrary strings', () => {
    const lines = ['$ pnpm install', 'progress: 1/100', 'progress: 100/100'];
    const props: LogProps = { ...defaultLogProps, lines };
    expect(props.lines).toEqual(lines);
  });
});
