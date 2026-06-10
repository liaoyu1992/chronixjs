import { describe, expect, it } from 'vitest';

import { resolveFocusDetectorClassList } from './resolve-focus-detector-class-list.js';

describe('resolveFocusDetectorClassList', () => {
  it('enabled → base only', () => {
    expect(resolveFocusDetectorClassList({ disabled: false })).toEqual(['cx-ui-focus-detector']);
  });

  it('disabled → appends --disabled', () => {
    expect(resolveFocusDetectorClassList({ disabled: true })).toContain(
      'cx-ui-focus-detector--disabled',
    );
  });
});
