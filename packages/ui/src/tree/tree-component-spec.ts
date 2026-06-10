import type { TreeNodeSpec } from './tree-spec.js';

export interface TreeNodeData {
  readonly label: string;
  readonly icon?: string | undefined;
  readonly disabled?: boolean;
  readonly isLeaf?: boolean;
}

export interface TreeProps {
  readonly value: string | undefined;
  readonly items: readonly TreeNodeSpec<TreeNodeData>[];
  readonly expandedKeys: ReadonlySet<string> | readonly string[] | undefined;
  readonly selectable: boolean;
  readonly defaultExpandAll: boolean;
  readonly draggable: boolean;
  readonly virtual: boolean;
  readonly virtualItemHeight: number;
  readonly height: number | string | undefined;
  readonly loadChildren:
    | ((node: TreeNodeSpec<TreeNodeData>) => Promise<readonly TreeNodeSpec<TreeNodeData>[]>)
    | undefined;
  readonly filter: string | undefined;
  readonly disabled: boolean;
}

export const DEFAULT_TREE_ROW_HEIGHT_PX = 28;

export const defaultTreeProps: TreeProps = {
  value: undefined,
  items: [],
  expandedKeys: undefined,
  selectable: true,
  defaultExpandAll: false,
  draggable: false,
  virtual: false,
  virtualItemHeight: DEFAULT_TREE_ROW_HEIGHT_PX,
  height: undefined,
  loadChildren: undefined,
  filter: undefined,
  disabled: false,
};
