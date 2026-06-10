import { describe, expect, it } from 'vitest';

import { defaultPopupSpec, type PopupPlacement } from './popup-spec.js';

describe('defaultPopupSpec', () => {
  it('has the expected default field values', () => {
    expect(defaultPopupSpec.placement).toBe('bottom');
    expect(defaultPopupSpec.offsetPx).toBe(4);
    expect(defaultPopupSpec.flip).toBe(true);
    expect(defaultPopupSpec.widthMatch).toBe(false);
    expect(defaultPopupSpec.viewportPaddingPx).toBe(8);
  });

  it('exposes the 5 PopupSpec fields (no leftover keys)', () => {
    expect(Object.keys(defaultPopupSpec).sort()).toEqual(
      ['flip', 'offsetPx', 'placement', 'viewportPaddingPx', 'widthMatch'].sort(),
    );
  });
});

describe('PopupPlacement enum', () => {
  it('all 12 values are accepted by the type', () => {
    const placements: readonly PopupPlacement[] = [
      'top',
      'top-start',
      'top-end',
      'bottom',
      'bottom-start',
      'bottom-end',
      'left',
      'left-start',
      'left-end',
      'right',
      'right-start',
      'right-end',
    ];
    expect(placements).toHaveLength(12);
  });
});
