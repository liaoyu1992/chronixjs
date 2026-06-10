/**
 * Transfer BEM class-list resolvers — Phase 33 (2026-06-05).
 */

export interface ResolveTransferRootClassListInput {
  readonly disabled: boolean;
}

export function resolveTransferRootClassList(input: ResolveTransferRootClassListInput): string[] {
  const cls = ['cx-ui-transfer'];
  if (input.disabled) cls.push('cx-ui-transfer--disabled');
  return cls;
}

export interface ResolveTransferPanelClassListInput {
  readonly position: 'source' | 'target';
}

export function resolveTransferPanelClassList(input: ResolveTransferPanelClassListInput): string[] {
  const cls = ['cx-ui-transfer__panel'];
  if (input.position === 'source') cls.push('cx-ui-transfer__panel--source');
  if (input.position === 'target') cls.push('cx-ui-transfer__panel--target');
  return cls;
}

export function resolveTransferHeaderClassList(): string[] {
  return ['cx-ui-transfer__header'];
}

export function resolveTransferBodyClassList(): string[] {
  return ['cx-ui-transfer__body'];
}

export interface ResolveTransferItemClassListInput {
  readonly disabled: boolean;
  readonly checked: boolean;
}

export function resolveTransferItemClassList(input: ResolveTransferItemClassListInput): string[] {
  const cls = ['cx-ui-transfer__item'];
  if (input.checked) cls.push('cx-ui-transfer__item--checked');
  if (input.disabled) cls.push('cx-ui-transfer__item--disabled');
  return cls;
}

export function resolveTransferActionsClassList(): string[] {
  return ['cx-ui-transfer__actions'];
}

export function resolveTransferFilterInputClassList(): string[] {
  return ['cx-ui-transfer__filter-input'];
}
