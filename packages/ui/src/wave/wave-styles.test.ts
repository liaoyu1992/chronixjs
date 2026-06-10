// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_WAVE_CSS, ensureChronixWaveStyles } from './wave-styles.js';

describe('CHRONIX_WAVE_CSS', () => {
  it('declares root + rippling + keyframe', () => {
    expect(CHRONIX_WAVE_CSS).toContain('.cx-ui-wave');
    expect(CHRONIX_WAVE_CSS).toContain('.cx-ui-wave--rippling');
    expect(CHRONIX_WAVE_CSS).toContain('.cx-ui-wave--disabled');
    expect(CHRONIX_WAVE_CSS).toContain('@keyframes cx-ui-wave-ripple');
  });
});

describe('ensureChronixWaveStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixWaveStyles();
    ensureChronixWaveStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="wave"]').length).toBe(1);
  });
});
