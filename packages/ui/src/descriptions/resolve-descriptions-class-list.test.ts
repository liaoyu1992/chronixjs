import { describe, expect, it } from 'vitest';

import { defaultDescriptionsProps, type DescriptionsProps } from './descriptions-spec.js';
import { resolveDescriptionsClassList } from './resolve-descriptions-class-list.js';

function props(over: Partial<DescriptionsProps> = {}): DescriptionsProps {
  return { ...defaultDescriptionsProps, ...over };
}

describe('resolveDescriptionsClassList', () => {
  it('returns base + size + placement for default props (no title, no border)', () => {
    expect(resolveDescriptionsClassList({ props: props(), hasTitle: false })).toEqual([
      'cx-ui-descriptions',
      'cx-ui-descriptions--medium',
      'cx-ui-descriptions--placement-left',
    ]);
  });

  it.each(['small', 'medium', 'large'] as const)(
    'reflects size="%s" via --{value} modifier',
    (size) => {
      const classes = resolveDescriptionsClassList({
        props: props({ size }),
        hasTitle: false,
      });
      expect(classes).toContain(`cx-ui-descriptions--${size}`);
    },
  );

  it.each(['left', 'top'] as const)(
    'reflects labelPlacement="%s" via --placement-{value} modifier',
    (labelPlacement) => {
      const classes = resolveDescriptionsClassList({
        props: props({ labelPlacement }),
        hasTitle: false,
      });
      expect(classes).toContain(`cx-ui-descriptions--placement-${labelPlacement}`);
    },
  );

  it('adds --bordered when props.bordered is true', () => {
    const classes = resolveDescriptionsClassList({
      props: props({ bordered: true }),
      hasTitle: false,
    });
    expect(classes).toContain('cx-ui-descriptions--bordered');
  });

  it('omits --bordered when props.bordered is false', () => {
    const classes = resolveDescriptionsClassList({
      props: props({ bordered: false }),
      hasTitle: false,
    });
    expect(classes).not.toContain('cx-ui-descriptions--bordered');
  });

  it('adds --with-title when hasTitle is true', () => {
    const classes = resolveDescriptionsClassList({
      props: props({ title: 'Profile' }),
      hasTitle: true,
    });
    expect(classes).toContain('cx-ui-descriptions--with-title');
  });

  it('combines bordered + with-title + size + placement', () => {
    const classes = resolveDescriptionsClassList({
      props: props({
        bordered: true,
        size: 'large',
        labelPlacement: 'top',
        title: 'Profile',
      }),
      hasTitle: true,
    });
    expect(classes).toEqual([
      'cx-ui-descriptions',
      'cx-ui-descriptions--large',
      'cx-ui-descriptions--placement-top',
      'cx-ui-descriptions--bordered',
      'cx-ui-descriptions--with-title',
    ]);
  });

  it('returns a fresh array per call', () => {
    const a = resolveDescriptionsClassList({ props: props(), hasTitle: false });
    const b = resolveDescriptionsClassList({ props: props(), hasTitle: false });
    expect(a).not.toBe(b);
  });
});
