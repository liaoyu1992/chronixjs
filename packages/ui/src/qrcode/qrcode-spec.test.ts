import { describe, expect, it } from 'vitest';

import {
  defaultQrCodeProps,
  type QrCodeErrorCorrectionLevel,
  type QrCodeProps,
} from './qrcode-spec.js';

describe('defaultQrCodeProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultQrCodeProps).toEqual({
      value: '',
      size: 200,
      errorCorrectionLevel: 'M',
      foreground: '#000000',
      background: '#ffffff',
    });
  });

  it('is a QrCodeProps-shape that adapters can spread', () => {
    const override: QrCodeProps = {
      ...defaultQrCodeProps,
      value: 'https://chronix.dev',
      size: 256,
      errorCorrectionLevel: 'H',
    };
    expect(override.value).toBe('https://chronix.dev');
    expect(override.size).toBe(256);
    expect(override.errorCorrectionLevel).toBe('H');
  });
});

describe('QrCodeErrorCorrectionLevel closed union', () => {
  it.each(['L', 'M', 'Q', 'H'] as const)(
    'accepts level "%s"',
    (level: QrCodeErrorCorrectionLevel) => {
      const props: QrCodeProps = {
        ...defaultQrCodeProps,
        errorCorrectionLevel: level,
      };
      expect(props.errorCorrectionLevel).toBe(level);
    },
  );
});
