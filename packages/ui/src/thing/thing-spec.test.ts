import { describe, expect, it } from 'vitest';

import { defaultThingProps, type ThingProps } from './thing-spec.js';

describe('defaultThingProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultThingProps).toEqual({
      title: undefined,
      description: undefined,
      contentIndented: false,
    });
  });

  it('is a ThingProps-shape that adapters can spread', () => {
    const override: ThingProps = {
      ...defaultThingProps,
      title: 'Project A',
      description: 'Status: green',
      contentIndented: true,
    };
    expect(override.title).toBe('Project A');
    expect(override.description).toBe('Status: green');
    expect(override.contentIndented).toBe(true);
  });
});

describe('ThingProps optional fields', () => {
  it('accepts undefined title and description', () => {
    const props: ThingProps = {
      title: undefined,
      description: undefined,
      contentIndented: false,
    };
    expect(props.title).toBeUndefined();
    expect(props.description).toBeUndefined();
  });

  it('accepts populated title with undefined description', () => {
    const props: ThingProps = {
      title: 'Heading',
      description: undefined,
      contentIndented: false,
    };
    expect(props.title).toBe('Heading');
    expect(props.description).toBeUndefined();
  });
});
