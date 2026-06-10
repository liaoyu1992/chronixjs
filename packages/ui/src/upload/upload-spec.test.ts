import { describe, expect, it } from 'vitest';

import { defaultUploadProps, type UploadProps } from './upload-spec.js';

describe('defaultUploadProps', () => {
  it('matches defaults', () => {
    expect(defaultUploadProps).toEqual({
      multiple: false,
      directory: false,
      disabled: false,
    });
  });

  it('action is undefined by default', () => {
    const props: UploadProps = { ...defaultUploadProps };
    expect(props.action).toBeUndefined();
  });

  it('fileList is undefined by default', () => {
    expect(defaultUploadProps.fileList).toBeUndefined();
  });

  it('accept is undefined by default', () => {
    expect(defaultUploadProps.accept).toBeUndefined();
  });
});
