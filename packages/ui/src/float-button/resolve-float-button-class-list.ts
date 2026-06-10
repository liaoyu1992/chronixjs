import type { FloatButtonShape, FloatButtonType } from './float-button-spec.js';

export interface ResolveFloatButtonClassListInput {
  readonly shape: FloatButtonShape;
  readonly type: FloatButtonType;
}

export function resolveFloatButtonClassList(input: ResolveFloatButtonClassListInput): string[] {
  return [
    'cx-ui-float-button',
    `cx-ui-float-button--shape-${input.shape}`,
    `cx-ui-float-button--type-${input.type}`,
  ];
}
