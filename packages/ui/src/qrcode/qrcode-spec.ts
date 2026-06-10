/**
 * QrCode IR — Phase 22 (2026-06-03). Tier A QR code SVG
 * rendering wrapping the optional `qrcode-generator` peer-dep.
 *
 * Per Phase 22 Decision C.1, `qrcode-generator` is chronix-ui's
 * third optional peer-dep (after `async-validator` at Phase 8 +
 * planned `date-fns` at Phase 14 / DatePicker). Consumers
 * `pnpm add qrcode-generator` to activate the QrCode component;
 * without it the adapter renders a placeholder div with the
 * `--unavailable` modifier. The chronix-ui core never throws at
 * import time.
 *
 * Public surface:
 *
 * - **`QrCodeErrorCorrectionLevel`** — closed union (4 levels).
 * - **`QrCodeProps`** + **`defaultQrCodeProps`**.
 */

/** QR code error correction level (Reed-Solomon redundancy). */
export type QrCodeErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrCodeProps {
  /** Value to encode. Typical use: URL, deep-link, contact-card, 2FA secret. */
  readonly value: string;
  /** Square render size in pixels (both width and height). */
  readonly size: number;
  /** Error correction level. L=7%, M=15%, Q=25%, H=30% redundancy. */
  readonly errorCorrectionLevel: QrCodeErrorCorrectionLevel;
  /** Dark module color (CSS color). */
  readonly foreground: string;
  /** Light module / background color (CSS color). */
  readonly background: string;
}

export const defaultQrCodeProps: QrCodeProps = {
  value: '',
  size: 200,
  errorCorrectionLevel: 'M',
  foreground: '#000000',
  background: '#ffffff',
};
