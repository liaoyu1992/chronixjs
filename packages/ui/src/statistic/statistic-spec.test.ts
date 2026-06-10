import { describe, expect, it } from 'vitest';

import { defaultStatisticProps, type StatisticProps } from './statistic-spec.js';

describe('defaultStatisticProps', () => {
  it('matches the documented defaults (all undefined except tabularNums=true)', () => {
    expect(defaultStatisticProps).toEqual({
      label: undefined,
      value: undefined,
      precision: undefined,
      tabularNums: true,
    });
  });

  it('is a StatisticProps-shape that adapters can spread', () => {
    const override: StatisticProps = {
      ...defaultStatisticProps,
      label: 'Revenue',
      value: 1234.5,
      precision: 2,
    };
    expect(override.label).toBe('Revenue');
    expect(override.value).toBe(1234.5);
    expect(override.precision).toBe(2);
  });
});
