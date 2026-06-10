import type { LayoutSiderPlacement } from './layout-spec.js';

export interface ResolveLayoutClassListInput {
  readonly hasSider: boolean;
  readonly position: 'static' | 'absolute';
}

export function resolveLayoutClassList(input: ResolveLayoutClassListInput): string[] {
  const classes = ['cx-ui-layout'];
  if (input.hasSider) classes.push('cx-ui-layout--has-sider');
  if (input.position === 'absolute') classes.push('cx-ui-layout--position-absolute');
  return classes;
}

export interface ResolveLayoutSiderClassListInput {
  readonly collapsed: boolean;
  readonly collapsible: boolean;
  readonly placement: LayoutSiderPlacement;
}

export function resolveLayoutSiderClassList(input: ResolveLayoutSiderClassListInput): string[] {
  const classes = ['cx-ui-layout__sider', `cx-ui-layout__sider--placement-${input.placement}`];
  if (input.collapsed) classes.push('cx-ui-layout__sider--collapsed');
  if (input.collapsible) classes.push('cx-ui-layout__sider--collapsible');
  return classes;
}

export function resolveLayoutHeaderClassList(): string[] {
  return ['cx-ui-layout__header'];
}

export function resolveLayoutContentClassList(): string[] {
  return ['cx-ui-layout__content'];
}

export function resolveLayoutFooterClassList(): string[] {
  return ['cx-ui-layout__footer'];
}
