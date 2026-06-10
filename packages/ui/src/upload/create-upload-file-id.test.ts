import { describe, expect, it } from 'vitest';

import { createUploadFileId } from './create-upload-file-id.js';

describe('createUploadFileId', () => {
  it('returns a non-empty string', () => {
    const id = createUploadFileId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique values on successive calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20; i++) {
      ids.add(createUploadFileId());
    }
    expect(ids.size).toBe(20);
  });

  it('contains a hyphen separator', () => {
    const id = createUploadFileId();
    expect(id).toContain('-');
  });
});
