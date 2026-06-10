import { describe, expect, it } from 'vitest';

import {
  defaultResultProps,
  RESULT_ICON_BY_STATUS,
  type ResultProps,
  type ResultStatus,
} from './result-spec.js';

describe('defaultResultProps', () => {
  it('matches the documented defaults (info, no title, no description)', () => {
    expect(defaultResultProps).toEqual({
      status: 'info',
      title: undefined,
      description: undefined,
    });
  });

  it('is a ResultProps-shape that adapters can spread', () => {
    const override: ResultProps = {
      ...defaultResultProps,
      status: '404',
      title: 'Not Found',
      description: 'The page you requested does not exist.',
    };
    expect(override.status).toBe('404');
    expect(override.title).toBe('Not Found');
  });
});

describe('RESULT_ICON_BY_STATUS', () => {
  it('covers all 9 status values', () => {
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
      expect(RESULT_ICON_BY_STATUS[s]).toBeTruthy();
      expect(typeof RESULT_ICON_BY_STATUS[s]).toBe('string');
    }
  });

  it('returns distinct icons per status (no accidental collisions)', () => {
    const icons = Object.values(RESULT_ICON_BY_STATUS);
    expect(new Set(icons).size).toBe(icons.length);
  });
});
