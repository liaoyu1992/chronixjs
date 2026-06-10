import { describe, expect, it } from 'vitest';

import {
  createFieldState,
  resetFieldState,
  withFieldErrors,
  withFieldTouched,
  withFieldValidating,
  withFieldValue,
} from './field-state.js';

describe('createFieldState', () => {
  it('builds a fresh field with no initial value', () => {
    const s = createFieldState<string>('username');
    expect(s.name).toBe('username');
    expect(s.value).toBeUndefined();
    expect(s.initialValue).toBeUndefined();
    expect(s.touched).toBe(false);
    expect(s.dirty).toBe(false);
    expect(s.validating).toBe(false);
    expect(s.errors).toEqual([]);
  });

  it('captures initial value', () => {
    const s = createFieldState('age', 18);
    expect(s.value).toBe(18);
    expect(s.initialValue).toBe(18);
  });
});

describe('withFieldValue', () => {
  it('updates value', () => {
    const s = createFieldState<string>('username');
    const s2 = withFieldValue(s, 'alice');
    expect(s2.value).toBe('alice');
  });

  it('marks dirty when value differs from initialValue', () => {
    const s = createFieldState<string>('username', 'alice');
    const s2 = withFieldValue(s, 'bob');
    expect(s2.dirty).toBe(true);
  });

  it('keeps dirty=false when value matches initialValue', () => {
    const s = createFieldState<string>('username', 'alice');
    const s2 = withFieldValue(s, 'alice');
    expect(s2.dirty).toBe(false);
  });

  it('dirty=true when initialValue was undefined and value is set', () => {
    const s = createFieldState<string>('username');
    const s2 = withFieldValue(s, '');
    // Empty string differs from undefined.
    expect(s2.dirty).toBe(true);
  });

  it('returns a new state object (immutable)', () => {
    const s = createFieldState<number>('count', 0);
    const s2 = withFieldValue(s, 1);
    expect(s2).not.toBe(s);
    expect(s.value).toBe(0);
  });

  it('uses Object.is for dirty detection (NaN compares equal to NaN)', () => {
    const s = createFieldState<number>('val', Number.NaN);
    const s2 = withFieldValue(s, Number.NaN);
    expect(s2.dirty).toBe(false);
  });
});

describe('withFieldTouched', () => {
  it('marks touched=true by default', () => {
    const s = createFieldState<string>('x');
    expect(withFieldTouched(s).touched).toBe(true);
  });

  it('accepts explicit false to untouch', () => {
    const s = withFieldTouched(createFieldState<string>('x'));
    const s2 = withFieldTouched(s, false);
    expect(s2.touched).toBe(false);
  });

  it('returns same reference when touched state is already correct (no spurious copy)', () => {
    const s = createFieldState<string>('x');
    expect(withFieldTouched(s, false)).toBe(s);
    const t = withFieldTouched(s, true);
    expect(withFieldTouched(t, true)).toBe(t);
  });
});

describe('withFieldErrors', () => {
  it('sets errors', () => {
    const s = createFieldState<string>('x');
    const s2 = withFieldErrors(s, [{ fieldName: 'x', message: 'required' }]);
    expect(s2.errors).toHaveLength(1);
    expect(s2.errors[0]!.message).toBe('required');
  });

  it('clears errors with empty array', () => {
    const s = withFieldErrors(createFieldState<string>('x'), [
      { fieldName: 'x', message: 'required' },
    ]);
    const s2 = withFieldErrors(s, []);
    expect(s2.errors).toEqual([]);
  });

  it('returns same reference when clearing already-empty errors', () => {
    const s = createFieldState<string>('x');
    expect(withFieldErrors(s, [])).toBe(s);
  });
});

describe('withFieldValidating', () => {
  it('toggles validating flag', () => {
    const s = createFieldState<string>('x');
    expect(withFieldValidating(s, true).validating).toBe(true);
    expect(withFieldValidating(withFieldValidating(s, true), false).validating).toBe(false);
  });

  it('returns same reference when flag is already correct', () => {
    const s = createFieldState<string>('x');
    expect(withFieldValidating(s, false)).toBe(s);
  });
});

describe('resetFieldState', () => {
  it('restores value to initialValue', () => {
    const s = withFieldValue(createFieldState<string>('x', 'alice'), 'bob');
    const reset = resetFieldState(s);
    expect(reset.value).toBe('alice');
  });

  it('clears touched / dirty / validating / errors', () => {
    let s = createFieldState<string>('x', 'a');
    s = withFieldValue(s, 'b');
    s = withFieldTouched(s);
    s = withFieldValidating(s, true);
    s = withFieldErrors(s, [{ fieldName: 'x', message: 'err' }]);
    const reset = resetFieldState(s);
    expect(reset.touched).toBe(false);
    expect(reset.dirty).toBe(false);
    expect(reset.validating).toBe(false);
    expect(reset.errors).toEqual([]);
  });

  it('returns a fresh object (never reference-equal to input)', () => {
    const s = createFieldState<string>('x');
    expect(resetFieldState(s)).not.toBe(s);
  });
});
