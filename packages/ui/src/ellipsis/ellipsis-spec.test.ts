import { describe, expect, it } from 'vitest';

import { defaultEllipsisProps, type EllipsisProps } from './ellipsis-spec.js';

describe('defaultEllipsisProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultEllipsisProps).toEqual({
      content: '',
      tooltip: true,
      lineClamp: 1,
    });
  });

  it('is an EllipsisProps-shape that adapters can spread', () => {
    const override: EllipsisProps = {
      ...defaultEllipsisProps,
      content: 'Long text',
      tooltip: false,
      lineClamp: 3,
    };
    expect(override.content).toBe('Long text');
    expect(override.tooltip).toBe(false);
    expect(override.lineClamp).toBe(3);
  });
});

describe('EllipsisProps shape', () => {
  it('accepts arbitrary content strings', () => {
    const props: EllipsisProps = {
      ...defaultEllipsisProps,
      content: 'a'.repeat(200),
    };
    expect(props.content.length).toBe(200);
  });

  it('accepts lineClamp values 1..N', () => {
    for (const lineClamp of [1, 2, 3, 4, 5, 10] as const) {
      const props: EllipsisProps = { ...defaultEllipsisProps, lineClamp };
      expect(props.lineClamp).toBe(lineClamp);
    }
  });
});
