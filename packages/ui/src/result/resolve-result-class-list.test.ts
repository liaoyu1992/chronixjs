import { describe, expect, it } from 'vitest';

import { resolveResultClassList } from './resolve-result-class-list.js';
import { defaultResultProps, type ResultStatus } from './result-spec.js';

describe('resolveResultClassList', () => {
  it('returns base + info status for defaults', () => {
    expect(resolveResultClassList(defaultResultProps, false)).toEqual([
      'cx-ui-result',
      'cx-ui-result--status-info',
    ]);
  });

  it('reflects all 9 status values via the --status-{value} modifier', () => {
    const statuses: ResultStatus[] = [
      'default',
      'info',
      'success',
      'warning',
      'error',
      '404',
      '403',
      '500',
      '418',
    ];
    for (const s of statuses) {
      const classes = resolveResultClassList({ ...defaultResultProps, status: s }, false);
      expect(classes).toContain(`cx-ui-result--status-${s}`);
    }
  });

  it('adds --with-title when title is supplied', () => {
    expect(resolveResultClassList({ ...defaultResultProps, title: 'Hello' }, false)).toContain(
      'cx-ui-result--with-title',
    );
  });

  it('adds --with-description when description is supplied', () => {
    expect(resolveResultClassList({ ...defaultResultProps, description: 'body' }, false)).toContain(
      'cx-ui-result--with-description',
    );
  });

  it('omits --with-title / --with-description when undefined', () => {
    const classes = resolveResultClassList(defaultResultProps, false);
    expect(classes).not.toContain('cx-ui-result--with-title');
    expect(classes).not.toContain('cx-ui-result--with-description');
  });

  it('adds --with-extra when hasExtra is true', () => {
    expect(resolveResultClassList(defaultResultProps, true)).toContain('cx-ui-result--with-extra');
  });

  it('returns a fresh array per call', () => {
    const a = resolveResultClassList(defaultResultProps, false);
    const b = resolveResultClassList(defaultResultProps, false);
    expect(a).not.toBe(b);
  });
});
