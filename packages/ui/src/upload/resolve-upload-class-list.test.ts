import { describe, expect, it } from 'vitest';

import { resolveUploadClassList, resolveUploadFileClassList } from './resolve-upload-class-list.js';

import type { UploadFileStatus } from './upload-spec.js';

describe('resolveUploadClassList', () => {
  it('returns base class only by default', () => {
    expect(resolveUploadClassList({})).toEqual(['cx-ui-upload']);
  });

  it('returns base class when disabled is false', () => {
    expect(resolveUploadClassList({ disabled: false })).toEqual(['cx-ui-upload']);
  });

  it('returns base + --disabled when disabled is true', () => {
    expect(resolveUploadClassList({ disabled: true })).toEqual([
      'cx-ui-upload',
      'cx-ui-upload--disabled',
    ]);
  });

  it('returns base only when disabled is undefined', () => {
    expect(resolveUploadClassList({ disabled: undefined })).toEqual(['cx-ui-upload']);
  });
});

describe('resolveUploadFileClassList', () => {
  const statuses: UploadFileStatus[] = ['pending', 'uploading', 'finished', 'error', 'removed'];

  it.each(statuses)('returns base + --%s for status %s', (status) => {
    expect(resolveUploadFileClassList({ status })).toEqual([
      'cx-ui-upload-file',
      `cx-ui-upload-file--${status}`,
    ]);
  });
});
