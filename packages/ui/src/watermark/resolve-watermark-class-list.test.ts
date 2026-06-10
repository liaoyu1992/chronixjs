import { describe, expect, it } from 'vitest';

import { resolveWatermarkClassList } from './resolve-watermark-class-list.js';
import { defaultWatermarkProps, type WatermarkProps } from './watermark-spec.js';

function props(over: Partial<WatermarkProps> = {}): WatermarkProps {
  return { ...defaultWatermarkProps, ...over };
}

describe('resolveWatermarkClassList', () => {
  it('returns the base class for default props', () => {
    expect(resolveWatermarkClassList(props())).toEqual(['cx-ui-watermark']);
  });

  it('returns a fresh array per call', () => {
    expect(resolveWatermarkClassList(props())).not.toBe(resolveWatermarkClassList(props()));
  });

  it('does not currently emit any modifiers (visual axes inline-styled)', () => {
    const variants: Partial<WatermarkProps>[] = [
      { rotate: 0 },
      { color: '#ff0000' },
      { opacity: 1 },
      { content: '' },
    ];
    for (const v of variants) {
      const classes = resolveWatermarkClassList(props(v));
      expect(classes).toEqual(['cx-ui-watermark']);
    }
  });
});
