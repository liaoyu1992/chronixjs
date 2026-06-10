import { describe, expect, it } from 'vitest';

import { defaultTreeProps, DEFAULT_TREE_ROW_HEIGHT_PX } from './tree-component-spec.js';

describe('defaultTreeProps', () => {
  it('has value=undefined', () => {
    expect(defaultTreeProps.value).toBeUndefined();
  });

  it('has items=[]', () => {
    expect(defaultTreeProps.items).toEqual([]);
  });

  it('has selectable=true', () => {
    expect(defaultTreeProps.selectable).toBe(true);
  });

  it('has defaultExpandAll=false', () => {
    expect(defaultTreeProps.defaultExpandAll).toBe(false);
  });

  it('has draggable=false', () => {
    expect(defaultTreeProps.draggable).toBe(false);
  });

  it('has virtual=false', () => {
    expect(defaultTreeProps.virtual).toBe(false);
  });

  it('has virtualItemHeight=28', () => {
    expect(defaultTreeProps.virtualItemHeight).toBe(28);
  });

  it('has disabled=false', () => {
    expect(defaultTreeProps.disabled).toBe(false);
  });
});

describe('DEFAULT_TREE_ROW_HEIGHT_PX', () => {
  it('equals 28', () => {
    expect(DEFAULT_TREE_ROW_HEIGHT_PX).toBe(28);
  });
});
