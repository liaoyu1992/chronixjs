import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ColumnSpec } from '@chronixjs/table';

import { ChronixColumnsToolPanel } from './chronix-columns-tool-panel.js';

import type { TableHandle } from './chronix-table.js';

function makeHandle(overrides: Partial<TableHandle> = {}): TableHandle {
  const noop = (): void => undefined;
  return {
    setColumnVisibility: noop,
    toggleColumnVisibility: noop,
    ...overrides,
  } as unknown as TableHandle;
}

describe('<ChronixColumnsToolPanel> (react)', () => {
  const columns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID' },
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'status', field: 'status', headerName: '状态', hide: true },
    { id: 'note', field: 'note', headerName: '备注' },
  ];

  it('renders one checkbox per column with checked state reflecting `column.hide !== true`', () => {
    const { container, unmount } = render(
      <ChronixColumnsToolPanel tableHandle={makeHandle()} columns={columns} />,
    );
    const rows = container.querySelectorAll('[data-tool-panel-col-id]');
    expect(rows).toHaveLength(4);
    const checkboxes = container.querySelectorAll<HTMLInputElement>(
      '.cx-table-columns-tool-panel__checkbox',
    );
    expect(checkboxes[0]!.checked).toBe(true);
    expect(checkboxes[1]!.checked).toBe(true);
    expect(checkboxes[2]!.checked).toBe(false); // hide: true
    expect(checkboxes[3]!.checked).toBe(true);
    unmount();
  });

  it('clicking a checkbox calls tableHandle.toggleColumnVisibility with that column id', () => {
    const toggle = vi.fn();
    const { container, unmount } = render(
      <ChronixColumnsToolPanel
        tableHandle={makeHandle({ toggleColumnVisibility: toggle })}
        columns={columns}
      />,
    );
    const checkboxes = container.querySelectorAll('.cx-table-columns-tool-panel__checkbox');
    fireEvent.click(checkboxes[1]!);
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveBeenCalledWith('name');
    unmount();
  });

  it('Show all / Hide all bulk buttons call setColumnVisibility per column', () => {
    const setVisibility = vi.fn();
    const { container, unmount } = render(
      <ChronixColumnsToolPanel
        tableHandle={makeHandle({ setColumnVisibility: setVisibility })}
        columns={columns}
      />,
    );
    const showAll = container.querySelector('[data-testid="cx-columns-tool-panel-show-all"]')!;
    fireEvent.click(showAll);
    expect(setVisibility).toHaveBeenCalledTimes(4);
    expect(setVisibility).toHaveBeenNthCalledWith(1, 'id', false);
    expect(setVisibility).toHaveBeenNthCalledWith(2, 'name', false);
    expect(setVisibility).toHaveBeenNthCalledWith(3, 'status', false);
    expect(setVisibility).toHaveBeenNthCalledWith(4, 'note', false);
    setVisibility.mockClear();
    const hideAll = container.querySelector('[data-testid="cx-columns-tool-panel-hide-all"]')!;
    fireEvent.click(hideAll);
    expect(setVisibility).toHaveBeenCalledTimes(4);
    expect(setVisibility).toHaveBeenNthCalledWith(1, 'id', true);
    expect(setVisibility).toHaveBeenNthCalledWith(2, 'name', true);
    expect(setVisibility).toHaveBeenNthCalledWith(3, 'status', true);
    expect(setVisibility).toHaveBeenNthCalledWith(4, 'note', true);
    unmount();
  });

  it('search input filters the visible checkbox list by column label substring (case-insensitive)', () => {
    const { container, unmount } = render(
      <ChronixColumnsToolPanel tableHandle={makeHandle()} columns={columns} />,
    );
    const search = container.querySelector<HTMLInputElement>(
      '[data-testid="cx-columns-tool-panel-search"]',
    )!;
    fireEvent.change(search, { target: { value: '名' } });
    let rows = container.querySelectorAll('[data-tool-panel-col-id]');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.getAttribute('data-tool-panel-col-id')).toBe('name');
    fireEvent.change(search, { target: { value: '' } });
    rows = container.querySelectorAll('[data-tool-panel-col-id]');
    expect(rows).toHaveLength(4);
    unmount();
  });
});
