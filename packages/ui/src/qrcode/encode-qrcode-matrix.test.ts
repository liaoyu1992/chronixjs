import qrcode from 'qrcode-generator';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  encodeQrCodeMatrix,
  getRegisteredQrCodeEncoder,
  registerQrCodeEncoder,
  type QrCodeFactory,
} from './encode-qrcode-matrix.js';

/**
 * Reset registration state between tests so the registration
 * surface can be exercised cleanly. The module slot is module-
 * local; we restore the qrcode-generator factory at the start
 * of each test for the encoder-available cases.
 */
function resetEncoder(): void {
  registerQrCodeEncoder(undefined as unknown as QrCodeFactory);
}

describe('registerQrCodeEncoder + getRegisteredQrCodeEncoder', () => {
  beforeEach(resetEncoder);

  it('returns the registered factory once set', () => {
    registerQrCodeEncoder(qrcode);
    expect(getRegisteredQrCodeEncoder()).toBe(qrcode);
  });

  it('overwrites the previous factory on re-registration', () => {
    const first = (() => ({})) as unknown as QrCodeFactory;
    const second = (() => ({})) as unknown as QrCodeFactory;
    registerQrCodeEncoder(first);
    registerQrCodeEncoder(second);
    expect(getRegisteredQrCodeEncoder()).toBe(second);
  });
});

describe('encodeQrCodeMatrix — no encoder registered', () => {
  beforeEach(resetEncoder);

  it('returns undefined when no encoder has been registered', () => {
    expect(encodeQrCodeMatrix('hello', 'M')).toBeUndefined();
  });

  it('returns undefined for empty value even with no encoder', () => {
    expect(encodeQrCodeMatrix('', 'M')).toBeUndefined();
  });
});

describe('encodeQrCodeMatrix — with qrcode-generator registered', () => {
  beforeEach(() => {
    registerQrCodeEncoder(qrcode);
  });
  afterEach(resetEncoder);

  it('returns undefined for empty input even with encoder', () => {
    expect(encodeQrCodeMatrix('', 'M')).toBeUndefined();
  });

  it('returns a square N×N boolean matrix for a normal string', () => {
    const matrix = encodeQrCodeMatrix('hello', 'M');
    expect(matrix).toBeDefined();
    const n = matrix!.length;
    expect(n).toBeGreaterThan(0);
    for (const row of matrix!) {
      expect(row.length).toBe(n);
      for (const cell of row) {
        expect(typeof cell).toBe('boolean');
      }
    }
  });

  it('returns at least one dark module for non-empty input', () => {
    const matrix = encodeQrCodeMatrix('chronix', 'M');
    const darkCount = matrix!.flat().reduce((acc, cell) => acc + (cell ? 1 : 0), 0);
    expect(darkCount).toBeGreaterThan(0);
  });

  it.each(['L', 'M', 'Q', 'H'] as const)('produces a valid matrix at EC level "%s"', (level) => {
    const matrix = encodeQrCodeMatrix('chronix', level);
    expect(matrix).toBeDefined();
    expect(matrix!.length).toBeGreaterThan(0);
  });

  it('higher EC level produces same-or-larger module count for the same input', () => {
    const lowEc = encodeQrCodeMatrix('chronix', 'L');
    const highEc = encodeQrCodeMatrix('chronix', 'H');
    expect(highEc!.length).toBeGreaterThanOrEqual(lowEc!.length);
  });

  it('produces a deterministic matrix for the same input + EC', () => {
    const a = encodeQrCodeMatrix('hello', 'M');
    const b = encodeQrCodeMatrix('hello', 'M');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('returns undefined if the registered encoder throws on a misuse', () => {
    const throwingFactory: QrCodeFactory = () => {
      throw new Error('intentional');
    };
    registerQrCodeEncoder(throwingFactory);
    expect(encodeQrCodeMatrix('hello', 'M')).toBeUndefined();
  });
});
