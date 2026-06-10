import { describe, expect, it } from 'vitest';

import { resolveTypographyClassList } from './resolve-typography-class-list.js';
import { defaultTypographyProps, type TypographyProps } from './typography-spec.js';

function props(over: Partial<TypographyProps> = {}): TypographyProps {
  return { ...defaultTypographyProps, ...over };
}

describe('resolveTypographyClassList', () => {
  it('returns base + --text for default props', () => {
    expect(resolveTypographyClassList(props())).toEqual([
      'cx-ui-typography',
      'cx-ui-typography--text',
    ]);
  });

  it('emits --level-N for title variant', () => {
    expect(resolveTypographyClassList(props({ variant: 'title', level: 3 }))).toEqual([
      'cx-ui-typography',
      'cx-ui-typography--title',
      'cx-ui-typography--level-3',
    ]);
  });

  it('omits --level-N for non-title variants', () => {
    const classes = resolveTypographyClassList(props({ variant: 'p', level: 2 }));
    expect(classes.some((c) => c.startsWith('cx-ui-typography--level-'))).toBe(false);
  });

  it('emits --italic + --underline modifiers', () => {
    const classes = resolveTypographyClassList(props({ italic: true, underline: true }));
    expect(classes).toContain('cx-ui-typography--italic');
    expect(classes).toContain('cx-ui-typography--underline');
  });
});
