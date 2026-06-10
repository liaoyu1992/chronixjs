import { describe, expect, it } from 'vitest';

import { defaultLogProps, type LogProps } from './log-spec.js';
import { resolveLogClassList } from './resolve-log-class-list.js';

function props(over: Partial<LogProps> = {}): LogProps {
  return { ...defaultLogProps, ...over };
}

describe('resolveLogClassList', () => {
  it('returns base only for default props', () => {
    expect(resolveLogClassList(props())).toEqual(['cx-ui-log']);
  });

  it('adds --with-line-numbers when lineNumbers=true', () => {
    expect(resolveLogClassList(props({ lineNumbers: true }))).toContain(
      'cx-ui-log--with-line-numbers',
    );
  });

  it('adds --loading when loading=true', () => {
    expect(resolveLogClassList(props({ loading: true }))).toContain('cx-ui-log--loading');
  });

  it('adds --wrap-lines when wrapLines=true', () => {
    expect(resolveLogClassList(props({ wrapLines: true }))).toContain('cx-ui-log--wrap-lines');
  });

  it('combines all 3 modifiers when every flag is on', () => {
    expect(
      resolveLogClassList(props({ lineNumbers: true, loading: true, wrapLines: true })),
    ).toEqual([
      'cx-ui-log',
      'cx-ui-log--with-line-numbers',
      'cx-ui-log--loading',
      'cx-ui-log--wrap-lines',
    ]);
  });

  it('omits modifiers when their flag is false', () => {
    const classes = resolveLogClassList(
      props({ lineNumbers: false, loading: false, wrapLines: false }),
    );
    expect(classes).not.toContain('cx-ui-log--with-line-numbers');
    expect(classes).not.toContain('cx-ui-log--loading');
    expect(classes).not.toContain('cx-ui-log--wrap-lines');
  });

  it('does not depend on lines content for the class list', () => {
    expect(resolveLogClassList(props({ lines: ['a', 'b', 'c'] }))).toEqual(['cx-ui-log']);
  });

  it('returns a fresh array per call', () => {
    expect(resolveLogClassList(props())).not.toBe(resolveLogClassList(props()));
  });
});
