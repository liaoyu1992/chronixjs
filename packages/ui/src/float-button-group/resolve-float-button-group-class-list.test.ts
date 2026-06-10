import { describe, expect, it } from 'vitest';

import { resolveFloatButtonGroupClassList } from './resolve-float-button-group-class-list.js';

describe('resolveFloatButtonGroupClassList', () => {
  it('static cluster (no trigger, not expanded) returns 2 classes', () => {
    expect(
      resolveFloatButtonGroupClassList({
        shape: 'circle',
        trigger: undefined,
        expanded: false,
      }),
    ).toEqual(['cx-ui-float-button-group', 'cx-ui-float-button-group--shape-circle']);
  });

  it('square + click trigger adds modifier', () => {
    expect(
      resolveFloatButtonGroupClassList({
        shape: 'square',
        trigger: 'click',
        expanded: false,
      }),
    ).toContain('cx-ui-float-button-group--trigger-click');
  });

  it('hover trigger adds modifier', () => {
    expect(
      resolveFloatButtonGroupClassList({
        shape: 'circle',
        trigger: 'hover',
        expanded: false,
      }),
    ).toContain('cx-ui-float-button-group--trigger-hover');
  });

  it('appends --expanded when expanded=true', () => {
    expect(
      resolveFloatButtonGroupClassList({
        shape: 'circle',
        trigger: 'click',
        expanded: true,
      }),
    ).toContain('cx-ui-float-button-group--expanded');
  });
});
