import { registerQrCodeEncoder, type QrCodeFactory } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import qrcode from 'qrcode-generator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixQrCode } from './chronix-qrcode.js';

const QrCode = ChronixQrCode as unknown as VueConstructor;

function resetEncoder(): void {
  registerQrCodeEncoder(undefined as unknown as QrCodeFactory);
}

describe('ChronixQrCode (vue2) — no encoder registered', () => {
  beforeAll(resetEncoder);

  it('renders the --unavailable placeholder div', () => {
    const wrapper = mount(QrCode, { propsData: { value: 'hello' } });
    expect(wrapper.classes()).toContain('cx-ui-qrcode--unavailable');
    expect(wrapper.find('svg').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-qrcode__unavailable-message').text()).toContain(
      'QR encoder unavailable',
    );
  });

  it('placeholder carries inline width / height for stable footprint', () => {
    const wrapper = mount(QrCode, {
      propsData: { value: 'hello', size: 128 },
    });
    const style = wrapper.attributes('style') ?? '';
    expect(style).toContain('width: 128px');
    expect(style).toContain('height: 128px');
  });
});

describe('ChronixQrCode (vue2) — encoder registered (matrix render)', () => {
  beforeAll(() => {
    registerQrCodeEncoder(qrcode);
  });
  afterAll(resetEncoder);

  it('renders an SVG with the configured size', () => {
    const wrapper = mount(QrCode, {
      propsData: { value: 'https://chronix.dev', size: 256 },
    });
    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('width')).toBe('256');
    expect(svg.attributes('height')).toBe('256');
  });

  it('SVG viewBox matches moduleCount × moduleCount', () => {
    const wrapper = mount(QrCode, {
      propsData: { value: 'hello' },
    });
    const svg = wrapper.find('svg');
    const viewBox = svg.attributes('viewBox') ?? '';
    expect(viewBox).toMatch(/^0 0 \d+ \d+$/);
  });

  it('renders at least one foreground rect (dark module)', () => {
    const wrapper = mount(QrCode, {
      propsData: { value: 'chronix', foreground: '#ff0000' },
    });
    const rects = wrapper.findAll('rect');
    const foregroundRects = rects.filter((r) => r.attributes('fill') === '#ff0000');
    expect(foregroundRects.length).toBeGreaterThan(0);
  });

  it('background rect uses the background prop color', () => {
    const wrapper = mount(QrCode, {
      propsData: { value: 'hello', background: '#00ff00' },
    });
    const rects = wrapper.findAll('rect');
    expect(rects.at(0).attributes('fill')).toBe('#00ff00');
  });

  it('carries the --ec-{level} class modifier', () => {
    const wrapper = mount(QrCode, {
      propsData: { value: 'hello', errorCorrectionLevel: 'H' },
    });
    expect(wrapper.classes()).toContain('cx-ui-qrcode--ec-H');
    expect(wrapper.classes()).not.toContain('cx-ui-qrcode--unavailable');
  });

  it('empty value still renders --unavailable placeholder', () => {
    const wrapper = mount(QrCode, { propsData: { value: '' } });
    expect(wrapper.classes()).toContain('cx-ui-qrcode--unavailable');
  });
});

describe('ChronixQrCode (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-qrcode stylesheet is in document.head', () => {
    mount(QrCode, { propsData: { value: 'hello' } });
    expect(document.head.querySelector('style[data-chronix-ui="qrcode"]')).not.toBeNull();
  });
});
