import { describe, expect, it } from 'vitest';

import { defaultQrCodeProps, type QrCodeProps } from './qrcode-spec.js';
import { resolveQrCodeClassList } from './resolve-qrcode-class-list.js';

function props(over: Partial<QrCodeProps> = {}): QrCodeProps {
  return { ...defaultQrCodeProps, ...over };
}

describe('resolveQrCodeClassList', () => {
  it('returns base + ec modifier for default props (encoder available)', () => {
    expect(resolveQrCodeClassList(props(), false)).toEqual(['cx-ui-qrcode', 'cx-ui-qrcode--ec-M']);
  });

  it.each(['L', 'M', 'Q', 'H'] as const)(
    'reflects errorCorrectionLevel="%s" via --ec-{value} modifier',
    (level) => {
      const classes = resolveQrCodeClassList(props({ errorCorrectionLevel: level }), false);
      expect(classes).toContain(`cx-ui-qrcode--ec-${level}`);
    },
  );

  it('adds --unavailable when isUnavailable is true', () => {
    expect(resolveQrCodeClassList(props(), true)).toContain('cx-ui-qrcode--unavailable');
  });

  it('omits --unavailable when isUnavailable is false', () => {
    expect(resolveQrCodeClassList(props(), false)).not.toContain('cx-ui-qrcode--unavailable');
  });

  it('returns a fresh array per call', () => {
    expect(resolveQrCodeClassList(props(), false)).not.toBe(resolveQrCodeClassList(props(), false));
  });
});
