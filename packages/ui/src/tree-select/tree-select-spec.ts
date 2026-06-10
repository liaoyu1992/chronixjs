/**
 * TreeSelect component IR — Phase 31 (2026-06-04).
 *
 * Select trigger + dropdown shell + nested Phase 30 Tree rows.
 * Combines Select's trigger UX with Tree's expandable hierarchy.
 */

import type { PopupPlacement } from '../popup/popup-spec.js';
import type { TreeNodeData } from '../tree/tree-component-spec.js';
import type { TreeNodeSpec } from '../tree/tree-spec.js';

export interface TreeSelectProps {
  /** Current value: single string or string[] (when multiple). */
  readonly value: string | readonly string[] | undefined;
  /** Tree data (reuses Phase 30 TreeNodeSpec). */
  readonly data: readonly TreeNodeSpec<TreeNodeData>[];
  readonly multiple: boolean;
  readonly clearable: boolean;
  readonly placeholder: string;
  readonly disabled: boolean;
  /** Expanded keys for the tree inside dropdown. */
  readonly expandedKeys: readonly string[];
  /** Enable tree node filtering. */
  readonly filterTree: boolean;
  readonly placement: PopupPlacement;
}

export const defaultTreeSelectProps: TreeSelectProps = {
  value: undefined,
  data: [],
  multiple: false,
  clearable: false,
  placeholder: '',
  disabled: false,
  expandedKeys: [],
  filterTree: false,
  placement: 'bottom-start',
};
