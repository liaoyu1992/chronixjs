/**
 * Slider BEM class-list resolvers — .
 */

export interface ResolveSliderRootClassListInput {
  readonly disabled: boolean;
  readonly vertical: boolean;
}

export function resolveSliderRootClassList(input: ResolveSliderRootClassListInput): string[] {
  const cls = ['cx-ui-slider'];
  if (input.disabled) cls.push('cx-ui-slider--disabled');
  if (input.vertical) cls.push('cx-ui-slider--vertical');
  return cls;
}

export function resolveSliderTrackClassList(): string[] {
  return ['cx-ui-slider__track'];
}

export function resolveSliderFillClassList(): string[] {
  return ['cx-ui-slider__fill'];
}

export interface ResolveSliderThumbClassListInput {
  readonly dragging: boolean;
}

export function resolveSliderThumbClassList(input: ResolveSliderThumbClassListInput): string[] {
  const cls = ['cx-ui-slider__thumb'];
  if (input.dragging) cls.push('cx-ui-slider__thumb--dragging');
  return cls;
}

export function resolveSliderMarksClassList(): string[] {
  return ['cx-ui-slider__marks'];
}

export interface ResolveSliderMarkClassListInput {
  readonly active: boolean;
}

export function resolveSliderMarkClassList(input: ResolveSliderMarkClassListInput): string[] {
  const cls = ['cx-ui-slider__mark'];
  if (input.active) cls.push('cx-ui-slider__mark--active');
  return cls;
}

export function resolveSliderMarkLabelClassList(): string[] {
  return ['cx-ui-slider__mark-label'];
}
