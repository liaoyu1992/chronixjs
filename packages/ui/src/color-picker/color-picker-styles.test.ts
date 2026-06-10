// @vitest-environment happy-dom

/**
 * ColorPicker core tests — Phase 33 (2026-06-05).
 */

import { describe, expect, it } from 'vitest';

import {
  defaultColorPickerProps,
  resolveColorPickerRootClassList,
  resolveColorPickerTriggerClassList,
  resolveColorPickerPanelClassList,
  resolveColorPickerSwatchClassList,
  CHRONIX_COLOR_PICKER_CSS,
  ensureChronixColorPickerStyles,
} from './index.js';

describe('defaultColorPickerProps', () => {
  it('has correct defaults', () => {
    expect(defaultColorPickerProps.value).toBeNull();
    expect(defaultColorPickerProps.swatches).toEqual([]);
    expect(defaultColorPickerProps.showAlpha).toBe(false);
    expect(defaultColorPickerProps.alpha).toBe(1);
    expect(defaultColorPickerProps.disabled).toBe(false);
    expect(defaultColorPickerProps.clearable).toBe(false);
  });
});

describe('resolveColorPickerRootClassList', () => {
  it('returns base class with no modifiers', () => {
    const result = resolveColorPickerRootClassList({ disabled: false, open: false });
    expect(result).toEqual(['cx-ui-color-picker']);
  });

  it('adds disabled modifier', () => {
    const result = resolveColorPickerRootClassList({ disabled: true, open: false });
    expect(result).toContain('cx-ui-color-picker--disabled');
  });

  it('adds open modifier', () => {
    const result = resolveColorPickerRootClassList({ disabled: false, open: true });
    expect(result).toContain('cx-ui-color-picker--open');
  });
});

describe('resolveColorPickerTriggerClassList', () => {
  it('returns base class with value', () => {
    const result = resolveColorPickerTriggerClassList({ hasValue: true });
    expect(result).toEqual(['cx-ui-color-picker__trigger']);
  });

  it('adds empty modifier when no value', () => {
    const result = resolveColorPickerTriggerClassList({ hasValue: false });
    expect(result).toContain('cx-ui-color-picker__trigger--empty');
  });
});

describe('resolveColorPickerPanelClassList', () => {
  it('adds hidden modifier when closed', () => {
    const result = resolveColorPickerPanelClassList({ open: false });
    expect(result).toContain('cx-ui-color-picker__panel--hidden');
  });

  it('no hidden modifier when open', () => {
    const result = resolveColorPickerPanelClassList({ open: true });
    expect(result).not.toContain('cx-ui-color-picker__panel--hidden');
  });
});

describe('resolveColorPickerSwatchClassList', () => {
  it('returns base class', () => {
    const result = resolveColorPickerSwatchClassList({ active: false });
    expect(result).toEqual(['cx-ui-color-picker__swatch']);
  });

  it('adds active modifier', () => {
    const result = resolveColorPickerSwatchClassList({ active: true });
    expect(result).toContain('cx-ui-color-picker__swatch--active');
  });
});

describe('CHRONIX_COLOR_PICKER_CSS', () => {
  it('declares root BEM class', () => {
    expect(CHRONIX_COLOR_PICKER_CSS).toContain('.cx-ui-color-picker');
  });

  it('declares SV square element', () => {
    expect(CHRONIX_COLOR_PICKER_CSS).toContain('.cx-ui-color-picker__square');
  });

  it('declares hue strip element', () => {
    expect(CHRONIX_COLOR_PICKER_CSS).toContain('.cx-ui-color-picker__hue-strip');
  });

  it('declares alpha strip element', () => {
    expect(CHRONIX_COLOR_PICKER_CSS).toContain('.cx-ui-color-picker__alpha-strip');
  });

  it('declares swatch element', () => {
    expect(CHRONIX_COLOR_PICKER_CSS).toContain('.cx-ui-color-picker__swatch');
  });

  it('declares hex input element', () => {
    expect(CHRONIX_COLOR_PICKER_CSS).toContain('.cx-ui-color-picker__hex-field');
  });

  it('declares disabled modifier', () => {
    expect(CHRONIX_COLOR_PICKER_CSS).toContain('.cx-ui-color-picker--disabled');
  });
});

describe('ensureChronixColorPickerStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixColorPickerStyles();
    ensureChronixColorPickerStyles();
    ensureChronixColorPickerStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="color-picker"]');
    expect(styles.length).toBe(1);
  });
});
