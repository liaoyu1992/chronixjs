import { registerQrCodeEncoder, type QrCodeFactory } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import qrcode from 'qrcode-generator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ChronixQrCode } from './chronix-qrcode.js';

function resetEncoder(): void {
  registerQrCodeEncoder(undefined as unknown as QrCodeFactory);
}

describe('ChronixQrCode — no encoder registered (unavailable fallback)', () => {
  beforeAll(resetEncoder);

  it('renders the --unavailable placeholder div', () => {
    const wrapper = mount(ChronixQrCode, { props: { value: 'hello' } });
    expect(wrapper.classes()).toContain('cx-ui-qrcode--unavailable');
    expect(wrapper.find('svg').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-qrcode__unavailable-message').text()).toContain(
      'QR encoder unavailable',
    );
  });

  it('placeholder carries inline width / height for stable footprint', () => {
    const wrapper = mount(ChronixQrCode, {
      props: { value: 'hello', size: 128 },
    });
    const style = wrapper.attributes('style') ?? '';
    expect(style).toContain('width: 128px');
    expect(style).toContain('height: 128px');
  });
});

describe('ChronixQrCode — encoder registered (matrix render)', () => {
  beforeAll(() => {
    registerQrCodeEncoder(qrcode);
  });
  afterAll(resetEncoder);

  it('renders an SVG with the configured size', () => {
    const wrapper = mount(ChronixQrCode, {
      props: { value: 'https://chronix.dev', size: 256 },
    });
    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('width')).toBe('256');
    expect(svg.attributes('height')).toBe('256');
  });

  it('SVG viewBox matches moduleCount × moduleCount', () => {
    const wrapper = mount(ChronixQrCode, {
      props: { value: 'hello', size: 200 },
    });
    const svg = wrapper.find('svg');
    const viewBox = svg.attributes('viewBox') ?? '';
    expect(viewBox).toMatch(/^0 0 \d+ \d+$/);
    const [, , w, h] = viewBox.split(' ');
    expect(w).toBe(h);
    expect(Number(w!)).toBeGreaterThan(0);
  });

  it('renders at least one foreground rect (dark module)', () => {
    const wrapper = mount(ChronixQrCode, {
      props: { value: 'chronix', foreground: '#ff0000' },
    });
    const rects = wrapper.findAll('rect');
    // background + at least one dark module
    expect(rects.length).toBeGreaterThan(1);
    const foregroundRects = rects.filter((r) => r.attributes('fill') === '#ff0000');
    expect(foregroundRects.length).toBeGreaterThan(0);
  });

  it('background rect uses the background prop color', () => {
    const wrapper = mount(ChronixQrCode, {
      props: { value: 'hello', background: '#00ff00' },
    });
    const rects = wrapper.findAll('rect');
    const bg = rects[0]!;
    expect(bg.attributes('fill')).toBe('#00ff00');
  });

  it('carries the --ec-{level} class modifier', () => {
    const wrapper = mount(ChronixQrCode, {
      props: { value: 'hello', errorCorrectionLevel: 'H' },
    });
    expect(wrapper.classes()).toContain('cx-ui-qrcode--ec-H');
    expect(wrapper.classes()).not.toContain('cx-ui-qrcode--unavailable');
  });

  it('empty value still renders --unavailable placeholder', () => {
    const wrapper = mount(ChronixQrCode, { props: { value: '' } });
    expect(wrapper.classes()).toContain('cx-ui-qrcode--unavailable');
  });
});

describe('ChronixQrCode — CSS injection', () => {
  it('mounting ensures the chronix-qrcode stylesheet is in document.head', () => {
    mount(ChronixQrCode, { props: { value: 'hello' } });
    expect(document.head.querySelector('style[data-chronix-ui="qrcode"]')).not.toBeNull();
  });
});
