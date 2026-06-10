import { describe, expect, it } from 'vitest';

import { resolveImageClassList } from './resolve-image-class-list.js';

describe('resolveImageClassList', () => {
  it('returns base only when not previewable and not failed', () => {
    expect(resolveImageClassList({ previewable: false, loadFailed: false })).toEqual([
      'cx-ui-image',
    ]);
  });

  it('appends --previewable when previewable=true', () => {
    expect(resolveImageClassList({ previewable: true, loadFailed: false })).toContain(
      'cx-ui-image--previewable',
    );
  });

  it('appends --failed when loadFailed=true', () => {
    expect(resolveImageClassList({ previewable: false, loadFailed: true })).toContain(
      'cx-ui-image--failed',
    );
  });
});
