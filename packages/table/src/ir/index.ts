/**
 * IR primitives barrel — the type vocabulary every chronix-table
 * pass / render helper / adapter consumes.
 *
 * Phase 1 (2026-05-23): `ColumnSpec`, `RowSpec`, `HeaderCell`.
 * Phase 8 (2026-05-24): `SortSpec`, `CellComparatorArgs`.
 * Phase 9 (2026-05-24): `FilterSpec` (discriminated union;
 * `TextFilterSpec` first variant) + `TextFilterOperator`.
 * Additional primitives (`CellSpec`, `CellRange`, `EditProposal`,
 * `ColumnGroupSpec`) land in their owning feature phases.
 */

export type { ColumnSpec, RowAction } from './column-spec.js';
export type { EditValidationError } from './edit-validation-error.js';
export type { RowSpec } from './row-spec.js';
export type { RowValidator, RowValidationViolation } from './row-validator.js';
export type { HeaderCell } from './header-cell.js';
export type { SortSpec, CellComparatorArgs } from './sort-spec.js';
export type {
  ExpressionFilterSpec,
  FilterSpec,
  MultiFilterChild,
  MultiFilterChildNumber,
  MultiFilterChildSet,
  MultiFilterChildText,
  MultiFilterEntry,
  MultiFilterGroup,
  MultiFilterSpec,
  NumberFilterOperator,
  NumberFilterSpec,
  SetFilterSpec,
  TextFilterOperator,
  TextFilterSpec,
} from './filter-spec.js';
export type {
  ExpressionAndNode,
  ExpressionCompareNode,
  ExpressionNotNode,
  ExpressionOperator,
  ExpressionOrNode,
  ExpressionScalar,
  ExpressionValue,
  FilterExpression,
} from './filter-expression.js';
export type {
  ToolPanelChangePayload,
  ToolPanelConfig,
  ToolPanelDescriptor,
  ToolPanelRenderer,
  ToolPanelWidthChangePayload,
} from './tool-panel.js';
export {
  DEFAULT_TOOL_PANEL_MAX_WIDTH_PX,
  DEFAULT_TOOL_PANEL_MIN_WIDTH_PX,
  DEFAULT_TOOL_PANEL_WIDTH_PX,
  TOOL_PANEL_ICON_RAIL_WIDTH_PX,
} from './tool-panel.js';
export type {
  ContextMenuConfig,
  ContextMenuContext,
  ContextMenuItem,
  ContextMenuOpenPayload,
} from './context-menu.js';
