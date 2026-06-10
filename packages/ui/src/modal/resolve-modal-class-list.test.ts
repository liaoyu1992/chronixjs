import { describe, expect, it } from 'vitest';

import { resolveModalWrapperClassList } from './resolve-modal-class-list.js';

describe('resolveModalWrapperClassList', () => {
  it('returns base only when closed without mask', () => {
    expect(resolveModalWrapperClassList({ open: false, mask: false })).toEqual([
      'cx-ui-modal-wrapper',
    ]);
  });

  it('adds --open when open=true', () => {
    expect(resolveModalWrapperClassList({ open: true, mask: false })).toContain(
      'cx-ui-modal-wrapper--open',
    );
  });

  it('adds --with-mask when mask=true', () => {
    expect(resolveModalWrapperClassList({ open: false, mask: true })).toContain(
      'cx-ui-modal-wrapper--with-mask',
    );
  });

  it('combines both modifiers when open + mask both true', () => {
    const classes = resolveModalWrapperClassList({ open: true, mask: true });
    expect(classes).toContain('cx-ui-modal-wrapper--open');
    expect(classes).toContain('cx-ui-modal-wrapper--with-mask');
  });
});
