import { describe, expect, it } from 'vitest';

import { encodeMarqueeKeyframes } from './encode-marquee-keyframes.js';

describe('encodeMarqueeKeyframes', () => {
  it('declares all 4 directional @keyframes blocks', () => {
    const css = encodeMarqueeKeyframes();
    expect(css).toContain('@keyframes cx-ui-marquee-scroll-left');
    expect(css).toContain('@keyframes cx-ui-marquee-scroll-right');
    expect(css).toContain('@keyframes cx-ui-marquee-scroll-up');
    expect(css).toContain('@keyframes cx-ui-marquee-scroll-down');
  });

  it('left direction transforms translateX from 0 to -50%', () => {
    const css = encodeMarqueeKeyframes();
    expect(css).toMatch(
      /@keyframes cx-ui-marquee-scroll-left\s*\{[\s\S]*?from\s*\{\s*transform:\s*translateX\(0\);\s*\}/,
    );
    expect(css).toMatch(
      /@keyframes cx-ui-marquee-scroll-left\s*\{[\s\S]*?to\s*\{\s*transform:\s*translateX\(-50%\);\s*\}/,
    );
  });

  it('right direction transforms translateX from -50% to 0', () => {
    const css = encodeMarqueeKeyframes();
    expect(css).toMatch(
      /@keyframes cx-ui-marquee-scroll-right\s*\{[\s\S]*?from\s*\{\s*transform:\s*translateX\(-50%\);\s*\}/,
    );
    expect(css).toMatch(
      /@keyframes cx-ui-marquee-scroll-right\s*\{[\s\S]*?to\s*\{\s*transform:\s*translateX\(0\);\s*\}/,
    );
  });

  it('up direction transforms translateY from 0 to -50%', () => {
    const css = encodeMarqueeKeyframes();
    expect(css).toMatch(
      /@keyframes cx-ui-marquee-scroll-up\s*\{[\s\S]*?from\s*\{\s*transform:\s*translateY\(0\);\s*\}/,
    );
    expect(css).toMatch(
      /@keyframes cx-ui-marquee-scroll-up\s*\{[\s\S]*?to\s*\{\s*transform:\s*translateY\(-50%\);\s*\}/,
    );
  });

  it('down direction transforms translateY from -50% to 0', () => {
    const css = encodeMarqueeKeyframes();
    expect(css).toMatch(
      /@keyframes cx-ui-marquee-scroll-down\s*\{[\s\S]*?from\s*\{\s*transform:\s*translateY\(-50%\);\s*\}/,
    );
    expect(css).toMatch(
      /@keyframes cx-ui-marquee-scroll-down\s*\{[\s\S]*?to\s*\{\s*transform:\s*translateY\(0\);\s*\}/,
    );
  });

  it('uses uniquely-namespaced keyframe names (no bare scroll/marquee)', () => {
    const css = encodeMarqueeKeyframes();
    // Phase 22 22-fr2 friction note — uniquely namespaced names
    // to avoid collisions with consumer CSS @keyframes rules.
    expect(css).not.toMatch(/@keyframes\s+scroll\b/);
    expect(css).not.toMatch(/@keyframes\s+marquee\b/);
  });
});
