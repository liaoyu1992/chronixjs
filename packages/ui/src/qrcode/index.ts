/**
 * chronix-ui qrcode module — Phase 22 (2026-06-03).
 */

export type { QrCodeErrorCorrectionLevel, QrCodeProps } from './qrcode-spec.js';
export { defaultQrCodeProps } from './qrcode-spec.js';
export {
  encodeQrCodeMatrix,
  getRegisteredQrCodeEncoder,
  registerQrCodeEncoder,
  type QrCodeFactory,
} from './encode-qrcode-matrix.js';
export { resolveQrCodeClassList } from './resolve-qrcode-class-list.js';
export { CHRONIX_QRCODE_CSS, ensureChronixQrCodeStyles } from './qrcode-styles.js';
