import { describe, expect, it } from 'vitest';

import { resolveStatisticClassList } from './resolve-statistic-class-list.js';
import { defaultStatisticProps } from './statistic-spec.js';

describe('resolveStatisticClassList', () => {
  it('returns base + tabular-nums for defaults', () => {
    expect(resolveStatisticClassList(defaultStatisticProps, false, false)).toEqual([
      'cx-ui-statistic',
      'cx-ui-statistic--tabular-nums',
    ]);
  });

  it('adds --with-label when label is supplied', () => {
    expect(
      resolveStatisticClassList({ ...defaultStatisticProps, label: 'Revenue' }, false, false),
    ).toContain('cx-ui-statistic--with-label');
  });

  it('adds --with-prefix / --with-suffix on the hasPrefix / hasSuffix booleans', () => {
    const classes = resolveStatisticClassList(defaultStatisticProps, true, true);
    expect(classes).toContain('cx-ui-statistic--with-prefix');
    expect(classes).toContain('cx-ui-statistic--with-suffix');
  });

  it('omits --tabular-nums when tabularNums=false', () => {
    expect(
      resolveStatisticClassList({ ...defaultStatisticProps, tabularNums: false }, false, false),
    ).not.toContain('cx-ui-statistic--tabular-nums');
  });

  it('returns a fresh array per call', () => {
    const a = resolveStatisticClassList(defaultStatisticProps, false, false);
    const b = resolveStatisticClassList(defaultStatisticProps, false, false);
    expect(a).not.toBe(b);
  });
});
