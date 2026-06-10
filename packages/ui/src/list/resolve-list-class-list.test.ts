import { describe, expect, it } from 'vitest';

import { defaultListProps, type ListProps } from './list-spec.js';
import { resolveListClassList } from './resolve-list-class-list.js';

function props(over: Partial<ListProps> = {}): ListProps {
  return { ...defaultListProps, ...over };
}

describe('resolveListClassList', () => {
  it('returns base + size + with-divider for default props', () => {
    expect(resolveListClassList(props())).toEqual([
      'cx-ui-list',
      'cx-ui-list--medium',
      'cx-ui-list--with-divider',
    ]);
  });

  it.each(['small', 'medium', 'large'] as const)(
    'reflects size="%s" via --{value} modifier',
    (size) => {
      expect(resolveListClassList(props({ size }))).toContain(`cx-ui-list--${size}`);
    },
  );

  it('adds --bordered when props.bordered is true', () => {
    expect(resolveListClassList(props({ bordered: true }))).toContain('cx-ui-list--bordered');
  });

  it('omits --bordered when props.bordered is false', () => {
    expect(resolveListClassList(props({ bordered: false }))).not.toContain('cx-ui-list--bordered');
  });

  it('adds --hoverable when props.hoverable is true', () => {
    expect(resolveListClassList(props({ hoverable: true }))).toContain('cx-ui-list--hoverable');
  });

  it('omits --with-divider when props.showDivider is false', () => {
    expect(resolveListClassList(props({ showDivider: false }))).not.toContain(
      'cx-ui-list--with-divider',
    );
  });

  it('combines all modifiers when all flags are on', () => {
    expect(
      resolveListClassList(
        props({
          bordered: true,
          hoverable: true,
          showDivider: true,
          size: 'large',
        }),
      ),
    ).toEqual([
      'cx-ui-list',
      'cx-ui-list--large',
      'cx-ui-list--bordered',
      'cx-ui-list--hoverable',
      'cx-ui-list--with-divider',
    ]);
  });

  it('returns a fresh array per call', () => {
    expect(resolveListClassList(props())).not.toBe(resolveListClassList(props()));
  });
});
