import { describe, expect, it } from 'vitest';

import { deriveStepItemStatus } from './derive-step-item-status.js';

import type { StepItem } from './steps-spec.js';

function item(over: Partial<StepItem> = {}): StepItem {
  return {
    key: 'k',
    title: 'T',
    description: undefined,
    status: undefined,
    ...over,
  };
}

describe('deriveStepItemStatus', () => {
  describe('per-item override wins verbatim', () => {
    it.each([
      ['wait', 0, 5],
      ['process', 2, 0],
      ['finish', 1, 0],
      ['error', 3, 1],
    ] as const)(
      'item.status="%s" overrides regardless of idx/current (%d vs %d)',
      (status, idx, current) => {
        expect(deriveStepItemStatus(item({ status }), idx, current)).toBe(status);
      },
    );
  });

  describe('auto-derive when item.status is undefined', () => {
    it('returns "finish" when idx < current', () => {
      expect(deriveStepItemStatus(item(), 0, 2)).toBe('finish');
      expect(deriveStepItemStatus(item(), 1, 2)).toBe('finish');
    });

    it('returns "process" when idx === current', () => {
      expect(deriveStepItemStatus(item(), 2, 2)).toBe('process');
    });

    it('returns "wait" when idx > current', () => {
      expect(deriveStepItemStatus(item(), 3, 2)).toBe('wait');
      expect(deriveStepItemStatus(item(), 10, 2)).toBe('wait');
    });
  });

  describe('edge cases', () => {
    it('handles current=0 (first step active)', () => {
      expect(deriveStepItemStatus(item(), 0, 0)).toBe('process');
      expect(deriveStepItemStatus(item(), 1, 0)).toBe('wait');
    });

    it('handles current beyond items length (all finish)', () => {
      expect(deriveStepItemStatus(item(), 0, 99)).toBe('finish');
      expect(deriveStepItemStatus(item(), 5, 99)).toBe('finish');
    });

    it('handles negative current (all wait + no process)', () => {
      expect(deriveStepItemStatus(item(), 0, -1)).toBe('wait');
    });
  });
});
