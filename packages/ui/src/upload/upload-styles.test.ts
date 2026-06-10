// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_UPLOAD_CSS, ensureChronixUploadStyles } from './upload-styles.js';

describe('CHRONIX_UPLOAD_CSS', () => {
  it('declares base + trigger + file list + file + status modifiers', () => {
    expect(CHRONIX_UPLOAD_CSS).toContain('.cx-ui-upload');
    expect(CHRONIX_UPLOAD_CSS).toContain('.cx-ui-upload__trigger');
    expect(CHRONIX_UPLOAD_CSS).toContain('.cx-ui-upload__file-list');
    expect(CHRONIX_UPLOAD_CSS).toContain('.cx-ui-upload-file');
    expect(CHRONIX_UPLOAD_CSS).toContain('.cx-ui-upload--disabled');
  });

  it('declares all file status modifiers', () => {
    for (const status of ['pending', 'uploading', 'finished', 'error', 'removed']) {
      expect(CHRONIX_UPLOAD_CSS).toContain(`.cx-ui-upload-file--${status}`);
    }
  });

  it('declares file sub-elements', () => {
    expect(CHRONIX_UPLOAD_CSS).toContain('.cx-ui-upload-file__name');
    expect(CHRONIX_UPLOAD_CSS).toContain('.cx-ui-upload-file__progress');
    expect(CHRONIX_UPLOAD_CSS).toContain('.cx-ui-upload-file__progress-bar');
  });
});

describe('ensureChronixUploadStyles', () => {
  it('injects exactly one stylesheet', () => {
    ensureChronixUploadStyles();
    ensureChronixUploadStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="upload"]').length).toBe(1);
  });
});
