import { describe, expect, it } from 'vitest';

import { resolveSpaceClassList } from './resolve-space-class-list.js';
import { defaultSpaceProps } from './space-spec.js';

describe('resolveSpaceClassList', () => {
  it('returns base + wrap for defaults (medium, horizontal, wrap)', () => {
    expect(resolveSpaceClassList(defaultSpaceProps)).toEqual(['cx-ui-space', 'cx-ui-space--wrap']);
  });

  it('adds --vertical when vertical=true', () => {
    expect(resolveSpaceClassList({ ...defaultSpaceProps, vertical: true })).toContain(
      'cx-ui-space--vertical',
    );
  });

  it('omits --wrap when wrap=false', () => {
    expect(resolveSpaceClassList({ ...defaultSpaceProps, wrap: false })).not.toContain(
      'cx-ui-space--wrap',
    );
  });

  it('adds --inline when inline=true', () => {
    expect(resolveSpaceClassList({ ...defaultSpaceProps, inline: true })).toContain(
      'cx-ui-space--inline',
    );
  });

  it('adds --align-{value} for each align option', () => {
    for (const a of ['start', 'center', 'end', 'baseline', 'stretch'] as const) {
      const classes = resolveSpaceClassList({ ...defaultSpaceProps, align: a });
      expect(classes).toContain(`cx-ui-space--align-${a}`);
    }
  });

  it('adds --justify-{value} for each justify option', () => {
    for (const j of [
      'start',
      'center',
      'end',
      'space-around',
      'space-between',
      'space-evenly',
    ] as const) {
      const classes = resolveSpaceClassList({ ...defaultSpaceProps, justify: j });
      expect(classes).toContain(`cx-ui-space--justify-${j}`);
    }
  });

  it('omits align / justify modifiers when undefined', () => {
    const classes = resolveSpaceClassList(defaultSpaceProps);
    expect(classes.some((c) => c.startsWith('cx-ui-space--align-'))).toBe(false);
    expect(classes.some((c) => c.startsWith('cx-ui-space--justify-'))).toBe(false);
  });

  it('returns a fresh array per call', () => {
    const a = resolveSpaceClassList(defaultSpaceProps);
    const b = resolveSpaceClassList(defaultSpaceProps);
    expect(a).not.toBe(b);
  });
});
