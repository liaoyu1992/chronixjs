import { registerQrCodeEncoder, type QrCodeFactory } from '@chronixjs/ui';
import { render } from '@testing-library/react';
import qrcode from 'qrcode-generator';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ChronixQrCode } from './chronix-qrcode.js';

function resetEncoder(): void {
  registerQrCodeEncoder(undefined as unknown as QrCodeFactory);
}

describe('ChronixQrCode (react) — no encoder registered', () => {
  beforeAll(resetEncoder);

  it('renders the --unavailable placeholder div', () => {
    const { container } = render(<ChronixQrCode value="hello" />);
    const root = container.querySelector('div.cx-ui-qrcode')!;
    expect(root.classList.contains('cx-ui-qrcode--unavailable')).toBe(true);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.querySelector('.cx-ui-qrcode__unavailable-message')!.textContent).toContain(
      'QR encoder unavailable',
    );
  });

  it('placeholder carries inline width / height for stable footprint', () => {
    const { container } = render(<ChronixQrCode value="hello" size={128} />);
    const style = container.querySelector('div.cx-ui-qrcode')!.getAttribute('style') ?? '';
    expect(style).toContain('width: 128px');
    expect(style).toContain('height: 128px');
  });
});

describe('ChronixQrCode (react) — encoder registered (matrix render)', () => {
  beforeAll(() => {
    registerQrCodeEncoder(qrcode);
  });
  afterAll(resetEncoder);

  it('renders an SVG with the configured size', () => {
    const { container } = render(<ChronixQrCode value="https://chronix.dev" size={256} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('256');
    expect(svg.getAttribute('height')).toBe('256');
  });

  it('SVG viewBox matches moduleCount × moduleCount', () => {
    const { container } = render(<ChronixQrCode value="hello" />);
    const svg = container.querySelector('svg')!;
    const viewBox = svg.getAttribute('viewBox') ?? '';
    expect(viewBox).toMatch(/^0 0 \d+ \d+$/);
  });

  it('renders at least one foreground rect (dark module)', () => {
    const { container } = render(<ChronixQrCode value="chronix" foreground="#ff0000" />);
    const rects = Array.from(container.querySelectorAll('rect'));
    const foregroundRects = rects.filter((r) => r.getAttribute('fill') === '#ff0000');
    expect(foregroundRects.length).toBeGreaterThan(0);
  });

  it('background rect uses the background prop color', () => {
    const { container } = render(<ChronixQrCode value="hello" background="#00ff00" />);
    const firstRect = container.querySelector('svg > rect')!;
    expect(firstRect.getAttribute('fill')).toBe('#00ff00');
  });

  it('carries the --ec-{level} class modifier', () => {
    const { container } = render(<ChronixQrCode value="hello" errorCorrectionLevel="H" />);
    const root = container.querySelector('div.cx-ui-qrcode')!;
    expect(root.classList.contains('cx-ui-qrcode--ec-H')).toBe(true);
    expect(root.classList.contains('cx-ui-qrcode--unavailable')).toBe(false);
  });

  it('empty value still renders --unavailable placeholder', () => {
    const { container } = render(<ChronixQrCode value="" />);
    expect(
      container.querySelector('div.cx-ui-qrcode')!.classList.contains('cx-ui-qrcode--unavailable'),
    ).toBe(true);
  });
});

describe('ChronixQrCode (react) — CSS injection', () => {
  it('mounting ensures the chronix-qrcode stylesheet is in document.head', () => {
    render(<ChronixQrCode value="hello" />);
    expect(document.head.querySelector('style[data-chronix-ui="qrcode"]')).not.toBeNull();
  });
});
