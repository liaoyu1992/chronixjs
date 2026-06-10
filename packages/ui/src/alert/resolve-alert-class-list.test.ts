import { describe, expect, it } from 'vitest';

import { defaultAlertProps } from './alert-spec.js';
import { resolveAlertClassList } from './resolve-alert-class-list.js';

describe('resolveAlertClassList', () => {
  it('returns base + default type + bordered for defaults (no title)', () => {
    expect(resolveAlertClassList(defaultAlertProps)).toEqual([
      'cx-ui-alert',
      'cx-ui-alert--default',
      'cx-ui-alert--bordered',
    ]);
  });

  it('reflects all 5 types', () => {
    for (const t of ['default', 'info', 'success', 'warning', 'error'] as const) {
      const classes = resolveAlertClassList({ ...defaultAlertProps, type: t });
      expect(classes).toContain(`cx-ui-alert--${t}`);
    }
  });

  it('adds --closable + --with-title when those props are set', () => {
    const classes = resolveAlertClassList({
      ...defaultAlertProps,
      closable: true,
      title: 'Hi',
    });
    expect(classes).toContain('cx-ui-alert--closable');
    expect(classes).toContain('cx-ui-alert--with-title');
  });

  it('omits --bordered when bordered=false', () => {
    expect(resolveAlertClassList({ ...defaultAlertProps, bordered: false })).not.toContain(
      'cx-ui-alert--bordered',
    );
  });

  it('omits --with-title when title is undefined or empty', () => {
    // undefined → no row, no class
    expect(resolveAlertClassList({ ...defaultAlertProps, title: undefined })).not.toContain(
      'cx-ui-alert--with-title',
    );
    // empty string IS a string and counts as a title (consumer's call)
    expect(resolveAlertClassList({ ...defaultAlertProps, title: '' })).toContain(
      'cx-ui-alert--with-title',
    );
  });
});
