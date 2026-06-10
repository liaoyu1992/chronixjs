// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import {
  CHRONIX_FOCUS_DETECTOR_CSS,
  ensureChronixFocusDetectorStyles,
} from './focus-detector-styles.js';

describe('CHRONIX_FOCUS_DETECTOR_CSS', () => {
  it('declares root BEM', () => {
    expect(CHRONIX_FOCUS_DETECTOR_CSS).toContain('.cx-ui-focus-detector');
  });
});

describe('ensureChronixFocusDetectorStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixFocusDetectorStyles();
    ensureChronixFocusDetectorStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="focus-detector"]').length).toBe(
      1,
    );
  });
});
