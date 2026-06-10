export interface RowSpec {
  readonly id: string;
  /** Reference to a parent row's id; `undefined` means top-level. */
  readonly parentId?: string;
  /** Display values for the left resource panel's column tree, keyed by column field. */
  readonly columns: Readonly<Record<string, string | number | undefined>>;
  /** Layout hint; passes are free to override based on bar density. */
  readonly heightHint?: number;
}
