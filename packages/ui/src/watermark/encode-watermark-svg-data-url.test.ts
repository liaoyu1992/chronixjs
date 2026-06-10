import { describe, expect, it } from 'vitest';

import { encodeWatermarkSvgDataUrl } from './encode-watermark-svg-data-url.js';
import { defaultWatermarkProps, type WatermarkProps } from './watermark-spec.js';

function props(over: Partial<WatermarkProps> = {}): WatermarkProps {
  return { ...defaultWatermarkProps, ...over };
}

describe('encodeWatermarkSvgDataUrl', () => {
  it('returns a string starting with the SVG data: URL prefix', () => {
    expect(encodeWatermarkSvgDataUrl(props())).toMatch(/^data:image\/svg\+xml,/);
  });

  it('URL-encodes the SVG content', () => {
    const url = encodeWatermarkSvgDataUrl(props({ content: 'Hello World' }));
    // Spaces should be %20-encoded (encodeURIComponent default).
    expect(url).toContain('%20');
    // The raw `<svg` opening should not appear unescaped.
    expect(url).not.toContain('<svg');
  });

  it('embeds the content text verbatim (after XML + URL encoding)', () => {
    const url = encodeWatermarkSvgDataUrl(props({ content: 'DRAFT' }));
    const decoded = decodeURIComponent(url.slice('data:image/svg+xml,'.length));
    expect(decoded).toContain('DRAFT');
    expect(decoded).toContain('<svg');
    expect(decoded).toContain('<text');
  });

  it('embeds the rotate angle in the SVG transform attribute', () => {
    const url = encodeWatermarkSvgDataUrl(props({ rotate: 45 }));
    const decoded = decodeURIComponent(url.slice('data:image/svg+xml,'.length));
    expect(decoded).toContain("transform='rotate(45 ");
  });

  it('embeds the color and opacity in the SVG fill attributes', () => {
    const url = encodeWatermarkSvgDataUrl(props({ color: '#ff0000', opacity: 0.5 }));
    const decoded = decodeURIComponent(url.slice('data:image/svg+xml,'.length));
    expect(decoded).toContain("fill='#ff0000'");
    expect(decoded).toContain("fill-opacity='0.5'");
  });

  it('XML-escapes special characters (& < > " \')', () => {
    const url = encodeWatermarkSvgDataUrl(props({ content: 'A & B < C > D " E \' F' }));
    const decoded = decodeURIComponent(url.slice('data:image/svg+xml,'.length));
    expect(decoded).toContain('A &amp; B &lt; C &gt; D &quot; E &apos; F');
    // The raw `&`/`<`/`>` should NOT appear as text content (they would
    // break the SVG XML); only as escaped entities + structural markup.
    expect(decoded).not.toContain('A & B');
  });

  it('centers the text at (width/2, height/2)', () => {
    const url = encodeWatermarkSvgDataUrl(props({ width: 300, height: 100 }));
    const decoded = decodeURIComponent(url.slice('data:image/svg+xml,'.length));
    expect(decoded).toContain("x='150'");
    expect(decoded).toContain("y='50'");
    expect(decoded).toContain("transform='rotate(-22 150 50)'");
  });

  it('returns a different URL for different props', () => {
    expect(encodeWatermarkSvgDataUrl(props({ content: 'A' }))).not.toBe(
      encodeWatermarkSvgDataUrl(props({ content: 'B' })),
    );
  });
});
