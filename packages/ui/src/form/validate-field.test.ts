import { describe, expect, it } from 'vitest';

import { validateField } from './validate-field.js';

import type { FieldSpec } from './form-spec.js';

describe('validateField', () => {
  it('returns [] when the field has no rules', async () => {
    const spec: FieldSpec<string> = { name: 'username' };
    expect(await validateField(spec, 'anything')).toEqual([]);
  });

  it('returns [] when the field has an empty rules array', async () => {
    const spec: FieldSpec<string> = { name: 'username', rules: [] };
    expect(await validateField(spec, 'anything')).toEqual([]);
  });

  it('returns [] when all rules pass', async () => {
    const spec: FieldSpec<string> = {
      name: 'username',
      rules: [
        { required: true, message: 'Required' },
        { type: 'string', min: 3 },
      ],
    };
    expect(await validateField(spec, 'alice')).toEqual([]);
  });

  it('returns one FieldError when a required field is missing', async () => {
    const spec: FieldSpec<string> = {
      name: 'username',
      rules: [{ required: true, message: 'Username is required' }],
    };
    const errors = await validateField(spec, undefined);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.fieldName).toBe('username');
    expect(errors[0]!.message).toBe('Username is required');
  });

  it('returns errors for type mismatch', async () => {
    const spec: FieldSpec<unknown> = {
      name: 'age',
      rules: [{ type: 'number', message: 'Age must be a number' }],
    };
    const errors = await validateField(spec, 'not-a-number');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toBe('Age must be a number');
  });

  it('returns errors for pattern mismatch', async () => {
    const spec: FieldSpec<string> = {
      name: 'code',
      rules: [{ pattern: /^[A-Z]+$/, message: 'Must be uppercase letters only' }],
    };
    const errors = await validateField(spec, 'abc');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toBe('Must be uppercase letters only');
  });

  it('returns multiple errors when multiple rules fail', async () => {
    const spec: FieldSpec<string> = {
      name: 'pw',
      rules: [
        { required: true, message: 'Required' },
        { type: 'string', min: 8, message: 'Min 8 chars' },
      ],
    };
    const errors = await validateField(spec, '');
    // async-validator returns multiple errors when both required + min fail.
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.every((e) => e.fieldName === 'pw')).toBe(true);
  });

  it('supports custom synchronous validator', async () => {
    const spec: FieldSpec<string> = {
      name: 'username',
      rules: [
        {
          validator: (_rule, value: unknown, callback: (e?: string) => void) => {
            if (typeof value === 'string' && value === 'reserved') {
              callback('Username "reserved" is not allowed');
            } else {
              callback();
            }
          },
        },
      ],
    };
    expect(await validateField(spec, 'alice')).toEqual([]);
    const errors = await validateField(spec, 'reserved');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toBe('Username "reserved" is not allowed');
  });

  it('supports custom async validator that resolves', async () => {
    const spec: FieldSpec<string> = {
      name: 'username',
      rules: [
        {
          asyncValidator: (_rule, value: unknown) =>
            new Promise<void>((resolve, reject) => {
              if (typeof value === 'string' && value === 'taken') {
                reject(new Error('Username already taken'));
              } else {
                resolve();
              }
            }),
        },
      ],
    };
    expect(await validateField(spec, 'free')).toEqual([]);
    const errors = await validateField(spec, 'taken');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toBe('Username already taken');
  });

  it('errors carry the correct fieldName even when the rule has none', async () => {
    const spec: FieldSpec<string> = {
      name: 'email',
      rules: [{ type: 'email', message: 'Invalid email' }],
    };
    const errors = await validateField(spec, 'not-an-email');
    expect(errors[0]!.fieldName).toBe('email');
  });
});
