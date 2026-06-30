import type { QrCodeErrorCorrectionLevel } from './qrcode-spec.js';

/**
 * Shape of a `qrcode-generator`-style factory. Declared here so
 * chronix-ui core has zero runtime dependency on the peer-dep —
 * consumers register the factory at app boot.
 */
export type QrCodeFactory = (
  typeNumber: 0,
  errorCorrectionLevel: QrCodeErrorCorrectionLevel,
) => {
  addData(data: string, mode?: string): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, col: number): boolean;
};

/**
 * Module-local slot for the registered QR encoder factory. Stays
 * `undefined` until the consumer calls
 * `registerQrCodeEncoder(qrcode)` once at app boot.
 *
 * . Decision C.1 — registration pattern is
 * the chronix-NEW idiom for optional peer-deps that need a
 * synchronous API + tree-shakeable bundle posture. Consumers who
 * never call `registerQrCodeEncoder` never pull
 * `qrcode-generator` into their bundle. The QrCode adapter
 * renders the `--unavailable` placeholder when the encoder slot
 * is empty.
 */
let registeredFactory: QrCodeFactory | undefined;

/**
 * Register the QR encoder factory with chronix-ui core.
 *
 * Consumer usage (run once at app boot, before any
 * `<ChronixQrCode>` mounts):
 *
 * ```ts
 * import qrcode from 'qrcode-generator';
 * import { registerQrCodeEncoder } from '@chronixjs/ui';
 * registerQrCodeEncoder(qrcode);
 * ```
 *
 * Re-registration is allowed (overwrites the previous factory) —
 * useful for hot-reload + tests.
 */
export function registerQrCodeEncoder(factory: QrCodeFactory): void {
  registeredFactory = factory;
}

/**
 * Returns the currently-registered factory, or `undefined` if
 * none has been registered. Exposed for adapter introspection /
 * dev-tools.
 */
export function getRegisteredQrCodeEncoder(): QrCodeFactory | undefined {
  return registeredFactory;
}

/**
 * Encode a QR code value into an N×N boolean matrix (true = dark
 * module).
 *
 * . Decision C.1.
 *
 * Returns:
 *
 * - `readonly (readonly boolean[])[]` — a 2D matrix; `matrix[r][c]`
 *   is `true` for dark modules.
 * - `undefined` — when (a) the value is empty (degenerate
 *   matrix), (b) no encoder has been registered, or (c) the
 *   encoder throws (e.g. value too long for the requested EC
 *   level). The adapter renders the `--unavailable` placeholder
 *   in all 3 cases — consumers can disambiguate via
 *   `getRegisteredQrCodeEncoder()`.
 */
export function encodeQrCodeMatrix(
  value: string,
  errorCorrectionLevel: QrCodeErrorCorrectionLevel,
): readonly (readonly boolean[])[] | undefined {
  if (value.length === 0) return undefined;
  if (!registeredFactory) return undefined;
  try {
    const qr = registeredFactory(0, errorCorrectionLevel);
    qr.addData(value);
    qr.make();
    const moduleCount = qr.getModuleCount();
    const matrix: boolean[][] = [];
    for (let r = 0; r < moduleCount; r += 1) {
      const row: boolean[] = [];
      for (let c = 0; c < moduleCount; c += 1) {
        row.push(qr.isDark(r, c));
      }
      matrix.push(row);
    }
    return matrix;
  } catch {
    return undefined;
  }
}
