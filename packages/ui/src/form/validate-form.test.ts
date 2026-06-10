import { describe, expect, it } from 'vitest';

import { validateForm } from './validate-form.js';

import type { FormSpec } from './form-spec.js';

describe('validateForm', () => {
  it('returns valid=true + empty fieldErrors when no field has rules', async () => {
    const spec: FormSpec = {
      fields: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
    };
    const result = await validateForm(spec, { a: 'x', b: 'y', c: 'z' });
    expect(result.valid).toBe(true);
    expect(result.fieldErrors).toEqual({});
  });

  it('returns valid=true when all rules pass', async () => {
    const spec: FormSpec = {
      fields: [
        { name: 'username', rules: [{ required: true, message: 'Required' }] },
        { name: 'age', rules: [{ type: 'number', message: 'Must be number' }] },
      ],
    };
    const result = await validateForm(spec, { username: 'alice', age: 30 });
    expect(result.valid).toBe(true);
    expect(result.fieldErrors).toEqual({});
  });

  it('returns valid=false + per-field errors when one field fails', async () => {
    const spec: FormSpec = {
      fields: [
        { name: 'username', rules: [{ required: true, message: 'Username required' }] },
        { name: 'age', rules: [{ type: 'number', message: 'Age must be a number' }] },
      ],
    };
    const result = await validateForm(spec, { username: 'alice', age: 'thirty' });
    expect(result.valid).toBe(false);
    expect(result.fieldErrors['age']).toHaveLength(1);
    expect(result.fieldErrors['age']![0]!.message).toBe('Age must be a number');
    // Username passed → not present in fieldErrors.
    expect(result.fieldErrors['username']).toBeUndefined();
  });

  it('returns errors for multiple failing fields', async () => {
    const spec: FormSpec = {
      fields: [
        { name: 'username', rules: [{ required: true, message: 'Username required' }] },
        { name: 'email', rules: [{ type: 'email', message: 'Invalid email' }] },
      ],
    };
    const result = await validateForm(spec, { username: undefined, email: 'not-an-email' });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.fieldErrors).sort()).toEqual(['email', 'username']);
  });

  it('treats missing values as undefined (required rule fires)', async () => {
    const spec: FormSpec = {
      fields: [{ name: 'username', rules: [{ required: true, message: 'Required' }] }],
    };
    const result = await validateForm(spec, {});
    expect(result.valid).toBe(false);
    expect(result.fieldErrors['username']).toHaveLength(1);
  });

  it('skips fields without rules even when they have values', async () => {
    const spec: FormSpec = {
      fields: [
        { name: 'metadata' }, // no rules
        { name: 'username', rules: [{ required: true, message: 'Required' }] },
      ],
    };
    const result = await validateForm(spec, { metadata: { x: 1 }, username: 'alice' });
    expect(result.valid).toBe(true);
    expect(result.fieldErrors['metadata']).toBeUndefined();
  });

  it('field errors all carry the correct fieldName', async () => {
    const spec: FormSpec = {
      fields: [
        { name: 'username', rules: [{ required: true, message: 'Required' }] },
        { name: 'email', rules: [{ type: 'email', message: 'Invalid email' }] },
      ],
    };
    const result = await validateForm(spec, {});
    for (const [fieldName, errs] of Object.entries(result.fieldErrors)) {
      for (const e of errs) {
        expect(e.fieldName).toBe(fieldName);
      }
    }
  });

  it('handles async-validator rules (asyncValidator)', async () => {
    const spec: FormSpec = {
      fields: [
        {
          name: 'username',
          rules: [
            {
              asyncValidator: (_rule, value: unknown) =>
                new Promise<void>((resolve, reject) => {
                  if (typeof value === 'string' && value === 'taken') {
                    reject(new Error('Already taken'));
                  } else {
                    resolve();
                  }
                }),
            },
          ],
        },
      ],
    };
    const ok = await validateForm(spec, { username: 'free' });
    expect(ok.valid).toBe(true);
    const fail = await validateForm(spec, { username: 'taken' });
    expect(fail.valid).toBe(false);
    expect(fail.fieldErrors['username']![0]!.message).toBe('Already taken');
  });
});
