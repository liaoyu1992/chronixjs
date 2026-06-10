/**
 * Icon component IR — Phase 24 (2026-06-03). Tier A SVG renderer
 * wrapping the Phase 9 IconRegistry.
 */

import { getIcon } from './icon-registry.js';

export interface IconProps {
  /** Registry name (e.g. `'check'`, `'chevron-down'`). */
  readonly name: string;
  /** Width + height in px. */
  readonly size: number;
}

export const defaultIconProps: IconProps = {
  name: '',
  size: 16,
};

/**
 * Returns whether the adapter should render the SVG or the missing
 * placeholder. Adapters call this once per render and switch on
 * the result.
 */
export function resolveIconRenderMode(name: string): 'svg' | 'missing' {
  return getIcon(name) !== undefined ? 'svg' : 'missing';
}
