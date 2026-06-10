import { describe, expect, it } from 'vitest';

import { resolveStepsClassList } from './resolve-steps-class-list.js';
import { defaultStepsProps, type StepItem } from './steps-spec.js';

function item(over: Partial<StepItem> = {}): StepItem {
  return {
    key: over.key ?? 'k',
    title: over.title ?? 'T',
    description: over.description ?? undefined,
    status: over.status ?? undefined,
  };
}

describe('resolveStepsClassList', () => {
  it('returns base + direction=horizontal for defaults', () => {
    expect(resolveStepsClassList(defaultStepsProps)).toEqual([
      'cx-ui-steps',
      'cx-ui-steps--horizontal',
    ]);
  });

  it('uses --vertical when direction is "vertical"', () => {
    const classes = resolveStepsClassList({
      ...defaultStepsProps,
      direction: 'vertical',
    });
    expect(classes).toContain('cx-ui-steps--vertical');
    expect(classes).not.toContain('cx-ui-steps--horizontal');
  });

  it('adds --has-error when any item is explicitly "error"', () => {
    const classes = resolveStepsClassList({
      ...defaultStepsProps,
      items: [item({ key: 'a' }), item({ key: 'b', status: 'error' }), item({ key: 'c' })],
      current: 0,
    });
    expect(classes).toContain('cx-ui-steps--has-error');
  });

  it('omits --has-error when no item is "error"', () => {
    const classes = resolveStepsClassList({
      ...defaultStepsProps,
      items: [item({ key: 'a' }), item({ key: 'b' })],
      current: 1,
    });
    expect(classes).not.toContain('cx-ui-steps--has-error');
  });

  it('--has-error is also driven by auto-derive (no explicit override needed if base item never auto-derives to error)', () => {
    const classes = resolveStepsClassList({
      ...defaultStepsProps,
      items: [item({ key: 'a' }), item({ key: 'b' })],
      current: 0,
    });
    expect(classes).not.toContain('cx-ui-steps--has-error');
  });

  it('returns a fresh array per call', () => {
    const a = resolveStepsClassList(defaultStepsProps);
    const b = resolveStepsClassList(defaultStepsProps);
    expect(a).not.toBe(b);
  });
});
