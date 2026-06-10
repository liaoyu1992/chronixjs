import { describe, expect, it } from 'vitest';

import { defaultFlexProps } from './flex-spec.js';
import { resolveFlexClassList } from './resolve-flex-class-list.js';

describe('resolveFlexClassList', () => {
  it('returns base + row + nowrap for defaults', () => {
    expect(resolveFlexClassList(defaultFlexProps)).toEqual([
      'cx-ui-flex',
      'cx-ui-flex--direction-row',
      'cx-ui-flex--wrap-nowrap',
    ]);
  });

  it('reflects all 4 direction values', () => {
    for (const d of ['row', 'column', 'row-reverse', 'column-reverse'] as const) {
      const classes = resolveFlexClassList({ ...defaultFlexProps, direction: d });
      expect(classes).toContain(`cx-ui-flex--direction-${d}`);
    }
  });

  it('reflects all 3 wrap values', () => {
    for (const w of ['nowrap', 'wrap', 'wrap-reverse'] as const) {
      const classes = resolveFlexClassList({ ...defaultFlexProps, wrap: w });
      expect(classes).toContain(`cx-ui-flex--wrap-${w}`);
    }
  });

  it('adds --inline when inline=true', () => {
    expect(resolveFlexClassList({ ...defaultFlexProps, inline: true })).toContain(
      'cx-ui-flex--inline',
    );
  });

  it('adds --align-{value} when align is defined', () => {
    for (const a of ['start', 'center', 'end', 'baseline', 'stretch'] as const) {
      expect(resolveFlexClassList({ ...defaultFlexProps, align: a })).toContain(
        `cx-ui-flex--align-${a}`,
      );
    }
  });

  it('adds --justify-{value} when justify is defined', () => {
    for (const j of [
      'start',
      'center',
      'end',
      'space-around',
      'space-between',
      'space-evenly',
    ] as const) {
      expect(resolveFlexClassList({ ...defaultFlexProps, justify: j })).toContain(
        `cx-ui-flex--justify-${j}`,
      );
    }
  });

  it('omits align / justify modifiers when undefined (default)', () => {
    const classes = resolveFlexClassList(defaultFlexProps);
    expect(classes.some((c) => c.startsWith('cx-ui-flex--align-'))).toBe(false);
    expect(classes.some((c) => c.startsWith('cx-ui-flex--justify-'))).toBe(false);
  });
});
