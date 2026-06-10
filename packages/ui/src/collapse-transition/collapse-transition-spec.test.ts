import { describe, expect, it } from 'vitest';

import { defaultCollapseTransitionProps } from './collapse-transition-spec.js';

describe('defaultCollapseTransitionProps', () => {
  it('starts collapsed at default 200ms', () => {
    expect(defaultCollapseTransitionProps).toEqual({ show: false, duration: 200 });
  });
});
