import { describe, expect, it } from 'vitest';

import { defaultCountdownProps } from './countdown-spec.js';
import { resolveCountdownClassList } from './resolve-countdown-class-list.js';

describe('resolveCountdownClassList', () => {
  it('returns base + tabular-nums for defaults', () => {
    expect(resolveCountdownClassList(defaultCountdownProps, false, false)).toEqual([
      'cx-ui-countdown',
      'cx-ui-countdown--tabular-nums',
    ]);
  });

  it('always emits --tabular-nums (countdown digits ALWAYS need alignment)', () => {
    // tabular-nums is hard-coded — there is no prop to turn it off.
    expect(resolveCountdownClassList(defaultCountdownProps, false, false)).toContain(
      'cx-ui-countdown--tabular-nums',
    );
  });

  it('adds --with-label when label is supplied', () => {
    expect(
      resolveCountdownClassList({ ...defaultCountdownProps, label: 'Ends in' }, false, false),
    ).toContain('cx-ui-countdown--with-label');
  });

  it('adds --paused when active=false', () => {
    expect(
      resolveCountdownClassList({ ...defaultCountdownProps, active: false }, false, false),
    ).toContain('cx-ui-countdown--paused');
  });

  it('omits --paused when active=true (default)', () => {
    expect(resolveCountdownClassList(defaultCountdownProps, false, false)).not.toContain(
      'cx-ui-countdown--paused',
    );
  });

  it('adds --with-prefix / --with-suffix on the adapter booleans', () => {
    const classes = resolveCountdownClassList(defaultCountdownProps, true, true);
    expect(classes).toContain('cx-ui-countdown--with-prefix');
    expect(classes).toContain('cx-ui-countdown--with-suffix');
  });
});
