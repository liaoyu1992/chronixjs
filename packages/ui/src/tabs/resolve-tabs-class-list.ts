import type { TabsPlacement, TabsSize, TabsType } from './tabs-spec.js';

export interface ResolveTabsClassListInput {
  readonly type: TabsType;
  readonly placement: TabsPlacement;
  readonly size: TabsSize;
  readonly disabled: boolean;
}

export function resolveTabsClassList(input: ResolveTabsClassListInput): string[] {
  const classes = [
    'cx-ui-tabs',
    `cx-ui-tabs--type-${input.type}`,
    `cx-ui-tabs--placement-${input.placement}`,
    `cx-ui-tabs--size-${input.size}`,
  ];
  if (input.disabled) classes.push('cx-ui-tabs--disabled');
  return classes;
}

export interface ResolveTabItemClassListInput {
  readonly active: boolean;
  readonly disabled: boolean;
  readonly closable: boolean;
}

export function resolveTabItemClassList(input: ResolveTabItemClassListInput): string[] {
  const classes = ['cx-ui-tabs__tab'];
  if (input.active) classes.push('cx-ui-tabs__tab--active');
  if (input.disabled) classes.push('cx-ui-tabs__tab--disabled');
  if (input.closable) classes.push('cx-ui-tabs__tab--closable');
  return classes;
}

export type ResolveTabsAddButtonClassListInput = void;

export function resolveTabsAddButtonClassList(): string[] {
  return ['cx-ui-tabs__add-btn'];
}
