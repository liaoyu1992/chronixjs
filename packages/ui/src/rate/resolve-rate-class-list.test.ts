import { describe, expect, it } from 'vitest';

import { defaultRateProps, type RateProps } from './rate-spec.js';
import { resolveRateClassList } from './resolve-rate-class-list.js';

function props(over: Partial<RateProps> = {}): RateProps {
  return { ...defaultRateProps, ...over };
}

describe('resolveRateClassList', () => {
  it('returns base only for defaults', () => {
    expect(resolveRateClassList(props())).toEqual(['cx-ui-rate']);
  });

  it('emits --disabled, --readonly, --invalid when set', () => {
    const classes = resolveRateClassList(props({ disabled: true, readonly: true, error: 'oops' }));
    expect(classes).toContain('cx-ui-rate--disabled');
    expect(classes).toContain('cx-ui-rate--readonly');
    expect(classes).toContain('cx-ui-rate--invalid');
  });
});
