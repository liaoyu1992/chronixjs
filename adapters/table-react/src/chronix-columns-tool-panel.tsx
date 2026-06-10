/**
 * Phase 81 (2026-05-30 — react port): pre-built columns tool
 * panel component the consumer drops into Phase 80's
 * `ToolPanelDescriptor.renderer` slot.
 *
 * Pure UI wrapper over `TableHandle.toggleColumnVisibility` +
 * `TableHandle.setColumnVisibility`. State is consumer-mirrored
 * via the `columns` prop.
 */
import { useMemo, useState, type ChangeEvent, type ReactElement } from 'react';

import type { ColumnSpec } from '@chronixjs/table';

import type { TableHandle } from './chronix-table.js';

export interface ChronixColumnsToolPanelProps {
  readonly tableHandle: TableHandle | null;
  readonly columns: readonly ColumnSpec[];
}

export function ChronixColumnsToolPanel(props: ChronixColumnsToolPanelProps): ReactElement {
  const { tableHandle, columns } = props;
  const [searchText, setSearchText] = useState('');

  const filteredColumns = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (q === '') return columns;
    return columns.filter((c) => {
      const label = c.headerName ?? c.id;
      return label.toLowerCase().includes(q);
    });
  }, [columns, searchText]);

  const onToggle = (colId: string): void => {
    tableHandle?.toggleColumnVisibility(colId);
  };

  const setAll = (hidden: boolean): void => {
    if (tableHandle == null) return;
    for (const col of columns) {
      tableHandle.setColumnVisibility(col.id, hidden);
    }
  };

  return (
    <div className="cx-table-columns-tool-panel">
      <div className="cx-table-columns-tool-panel__header">
        <input
          className="cx-table-columns-tool-panel__search"
          type="text"
          placeholder="搜索列…"
          value={searchText}
          data-testid="cx-columns-tool-panel-search"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setSearchText(e.target.value);
          }}
        />
      </div>
      <div className="cx-table-columns-tool-panel__body">
        {filteredColumns.map((col) => (
          <label
            key={col.id}
            className="cx-table-columns-tool-panel__row"
            data-tool-panel-col-id={col.id}
          >
            <input
              className="cx-table-columns-tool-panel__checkbox"
              type="checkbox"
              checked={col.hide !== true}
              onChange={() => onToggle(col.id)}
            />
            <span className="cx-table-columns-tool-panel__label">{col.headerName ?? col.id}</span>
          </label>
        ))}
      </div>
      <div className="cx-table-columns-tool-panel__footer">
        <button
          type="button"
          className="cx-table-columns-tool-panel__bulk-action"
          data-testid="cx-columns-tool-panel-show-all"
          onClick={() => setAll(false)}
        >
          全部显示
        </button>
        <button
          type="button"
          className="cx-table-columns-tool-panel__bulk-action"
          data-testid="cx-columns-tool-panel-hide-all"
          onClick={() => setAll(true)}
        >
          全部隐藏
        </button>
      </div>
    </div>
  );
}
