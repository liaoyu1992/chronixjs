import { describe, expect, it } from 'vitest';

import { defaultEllipsisProps, type EllipsisProps } from './ellipsis-spec.js';
import { resolveEllipsisClassList } from './resolve-ellipsis-class-list.js';

function props(over: Partial<EllipsisProps> = {}): EllipsisProps {
  return { ...defaultEllipsisProps, ...over };
}

describe('resolveEllipsisClassList', () => {
  it('returns base + --lines-1 + --with-tooltip for default props', () => {
    expect(resolveEllipsisClassList(props())).toEqual([
      'cx-ui-ellipsis',
      'cx-ui-ellipsis--lines-1',
      'cx-ui-ellipsis--with-tooltip',
    ]);
  });

  it.each([1, 2, 3, 4, 5] as const)(
    'emits --lines-%i modifier for canonical lineClamp values',
    (lineClamp) => {
      expect(resolveEllipsisClassList(props({ lineClamp }))).toContain(
        `cx-ui-ellipsis--lines-${lineClamp}`,
      );
    },
  );

  it('omits the --lines-N modifier for lineClamp=0', () => {
    const classes = resolveEllipsisClassList(props({ lineClamp: 0 }));
    expect(classes).not.toContain('cx-ui-ellipsis--lines-0');
    expect(classes.some((c) => c.startsWith('cx-ui-ellipsis--lines-'))).toBe(false);
  });

  it('omits the --lines-N modifier for lineClamp out of [1, 5]', () => {
    const classes = resolveEllipsisClassList(props({ lineClamp: 10 }));
    expect(classes.some((c) => c.startsWith('cx-ui-ellipsis--lines-'))).toBe(false);
  });

  it('omits the --lines-N modifier for non-integer lineClamp', () => {
    const classes = resolveEllipsisClassList(props({ lineClamp: 2.5 }));
    expect(classes.some((c) => c.startsWith('cx-ui-ellipsis--lines-'))).toBe(false);
  });

  it('omits --with-tooltip when tooltip=false', () => {
    expect(resolveEllipsisClassList(props({ tooltip: false }))).not.toContain(
      'cx-ui-ellipsis--with-tooltip',
    );
  });

  it('combines lineClamp + with-tooltip when both apply', () => {
    expect(resolveEllipsisClassList(props({ lineClamp: 3, tooltip: true }))).toEqual([
      'cx-ui-ellipsis',
      'cx-ui-ellipsis--lines-3',
      'cx-ui-ellipsis--with-tooltip',
    ]);
  });

  it('returns a fresh array per call', () => {
    expect(resolveEllipsisClassList(props())).not.toBe(resolveEllipsisClassList(props()));
  });

  it('preserves base class even when both modifiers opt out', () => {
    expect(resolveEllipsisClassList(props({ lineClamp: 0, tooltip: false }))).toEqual([
      'cx-ui-ellipsis',
    ]);
  });
});
