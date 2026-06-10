import type { QrCodeProps } from './qrcode-spec.js';

/**
 * Compute class set for the QrCode root element.
 *
 * Phase 22 (2026-06-03).
 *
 * Class structure:
 *
 * - `'cx-ui-qrcode'` — always present.
 * - `'cx-ui-qrcode--ec-{level}'` — one of `'L' | 'M' | 'Q' | 'H'`.
 *   Lets consumer-side CSS theme based on chosen error correction
 *   level (rarely useful but tracks the prop axis).
 * - `'cx-ui-qrcode--unavailable'` — present iff `isUnavailable`.
 *   Driven by `encodeQrCodeMatrix(...) === undefined` at the
 *   adapter level (no encoder registered OR encoder threw OR
 *   empty value).
 */
export function resolveQrCodeClassList(props: QrCodeProps, isUnavailable: boolean): string[] {
  const classes = ['cx-ui-qrcode', `cx-ui-qrcode--ec-${props.errorCorrectionLevel}`];
  if (isUnavailable) classes.push('cx-ui-qrcode--unavailable');
  return classes;
}
