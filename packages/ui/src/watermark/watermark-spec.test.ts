import { describe, expect, it } from 'vitest';

import { defaultWatermarkProps, type WatermarkProps } from './watermark-spec.js';

describe('defaultWatermarkProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultWatermarkProps).toEqual({
      content: 'Watermark',
      width: 200,
      height: 80,
      rotate: -22,
      fontSize: 16,
      color: '#000000',
      opacity: 0.15,
    });
  });

  it('is a WatermarkProps-shape that adapters can spread', () => {
    const override: WatermarkProps = {
      ...defaultWatermarkProps,
      content: 'CONFIDENTIAL',
      rotate: 30,
      opacity: 0.3,
    };
    expect(override.content).toBe('CONFIDENTIAL');
    expect(override.rotate).toBe(30);
    expect(override.opacity).toBe(0.3);
    // unchanged fields still hold defaults
    expect(override.width).toBe(200);
    expect(override.color).toBe('#000000');
  });

  it('accepts arbitrary Unicode content', () => {
    const override: WatermarkProps = {
      ...defaultWatermarkProps,
      content: '机密 · CONFIDENTIAL · 🔒',
    };
    expect(override.content).toBe('机密 · CONFIDENTIAL · 🔒');
  });
});
