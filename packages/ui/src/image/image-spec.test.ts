import { describe, expect, it } from 'vitest';

import {
  defaultImageProps,
  resolveImageEffectiveSrc,
  resolveImageInlineStyle,
} from './image-spec.js';

describe('defaultImageProps', () => {
  it('defaults to lazy + cover + non-previewable + no fallback', () => {
    expect(defaultImageProps).toEqual({
      src: '',
      alt: undefined,
      width: undefined,
      height: undefined,
      objectFit: 'cover',
      previewable: false,
      lazy: true,
      fallback: undefined,
    });
  });
});

describe('resolveImageEffectiveSrc', () => {
  it('returns src when load succeeded', () => {
    expect(
      resolveImageEffectiveSrc({
        src: 'https://example.com/a.png',
        fallback: 'https://example.com/fb.png',
        loadFailed: false,
      }),
    ).toBe('https://example.com/a.png');
  });

  it('returns fallback when load failed and fallback is defined', () => {
    expect(
      resolveImageEffectiveSrc({
        src: 'https://example.com/a.png',
        fallback: 'https://example.com/fb.png',
        loadFailed: true,
      }),
    ).toBe('https://example.com/fb.png');
  });

  it('returns src when load failed but no fallback is defined', () => {
    expect(
      resolveImageEffectiveSrc({
        src: 'https://example.com/a.png',
        fallback: undefined,
        loadFailed: true,
      }),
    ).toBe('https://example.com/a.png');
  });
});

describe('resolveImageInlineStyle', () => {
  it('always emits objectFit', () => {
    const s = resolveImageInlineStyle({
      width: undefined,
      height: undefined,
      objectFit: 'contain',
    });
    expect(s).toEqual({ objectFit: 'contain' });
  });

  it('emits px width / height for numbers', () => {
    expect(resolveImageInlineStyle({ width: 200, height: 150, objectFit: 'cover' })).toEqual({
      objectFit: 'cover',
      width: '200px',
      height: '150px',
    });
  });

  it('passes string width / height verbatim', () => {
    expect(resolveImageInlineStyle({ width: '50%', height: 'auto', objectFit: 'cover' })).toEqual({
      objectFit: 'cover',
      width: '50%',
      height: 'auto',
    });
  });
});
