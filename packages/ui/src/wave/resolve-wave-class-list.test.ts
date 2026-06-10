import { describe, expect, it } from 'vitest';

import { resolveWaveClassList } from './resolve-wave-class-list.js';

describe('resolveWaveClassList', () => {
  it('idle + enabled → base only', () => {
    expect(resolveWaveClassList({ rippling: false, disabled: false })).toEqual(['cx-ui-wave']);
  });

  it('rippling → appends --rippling', () => {
    expect(resolveWaveClassList({ rippling: true, disabled: false })).toContain(
      'cx-ui-wave--rippling',
    );
  });

  it('disabled → appends --disabled', () => {
    expect(resolveWaveClassList({ rippling: false, disabled: true })).toContain(
      'cx-ui-wave--disabled',
    );
  });
});
