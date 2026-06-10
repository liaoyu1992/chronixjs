import { mount } from '@vue/test-utils';
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

describe('<ChronixColumnsToolPanel> (vue3)', () => {
  const columns: readonly ColumnSpec[] = [
    { id: 'id', field: 'id', headerName: 'ID' },
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'status', field: 'status', headerName: '状态', hide: true },
    { id: 'note', field: 'note', headerName: '备注' },
  ];

  it('renders one checkbox per column with checked state reflecting `column.hide !== true`', () => {
    const wrapper = mount(ChronixColumnsToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
      },
    });
    const rows = wrapper.findAll('[data-tool-panel-col-id]');
    expect(rows).toHaveLength(4);
    const checkboxes = wrapper.findAll<HTMLInputElement>('.cx-table-columns-tool-panel__checkbox');
    expect(checkboxes[0]!.element.checked).toBe(true);
    expect(checkboxes[1]!.element.checked).toBe(true);
    expect(checkboxes[2]!.element.checked).toBe(false); // hide: true
    expect(checkboxes[3]!.element.checked).toBe(true);
    wrapper.unmount();
  });

  it('clicking a checkbox calls tableHandle.toggleColumnVisibility with that column id', async () => {
    const toggle = vi.fn();
    const wrapper = mount(ChronixColumnsToolPanel, {
      props: {
        tableHandle: makeHandle({ toggleColumnVisibility: toggle }),
        columns,
      },
    });
    const checkboxes = wrapper.findAll('.cx-table-columns-tool-panel__checkbox');
    await checkboxes[1]!.trigger('change');
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveBeenCalledWith('name');
    wrapper.unmount();
  });

  it('Show all / Hide all bulk buttons call setColumnVisibility per column', async () => {
    const setVisibility = vi.fn();
    const wrapper = mount(ChronixColumnsToolPanel, {
      props: {
        tableHandle: makeHandle({ setColumnVisibility: setVisibility }),
        columns,
      },
    });
    await wrapper.find('[data-testid="cx-columns-tool-panel-show-all"]').trigger('click');
    expect(setVisibility).toHaveBeenCalledTimes(4);
    expect(setVisibility).toHaveBeenNthCalledWith(1, 'id', false);
    expect(setVisibility).toHaveBeenNthCalledWith(2, 'name', false);
    expect(setVisibility).toHaveBeenNthCalledWith(3, 'status', false);
    expect(setVisibility).toHaveBeenNthCalledWith(4, 'note', false);
    setVisibility.mockClear();
    await wrapper.find('[data-testid="cx-columns-tool-panel-hide-all"]').trigger('click');
    expect(setVisibility).toHaveBeenCalledTimes(4);
    expect(setVisibility).toHaveBeenNthCalledWith(1, 'id', true);
    expect(setVisibility).toHaveBeenNthCalledWith(2, 'name', true);
    expect(setVisibility).toHaveBeenNthCalledWith(3, 'status', true);
    expect(setVisibility).toHaveBeenNthCalledWith(4, 'note', true);
    wrapper.unmount();
  });

  it('search input filters the visible checkbox list by column label substring (case-insensitive)', async () => {
    const wrapper = mount(ChronixColumnsToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
      },
    });
    const search = wrapper.find<HTMLInputElement>('[data-testid="cx-columns-tool-panel-search"]');
    await search.setValue('名');
    expect(wrapper.findAll('[data-tool-panel-col-id]')).toHaveLength(1);
    expect(wrapper.find('[data-tool-panel-col-id]').attributes('data-tool-panel-col-id')).toBe(
      'name',
    );
    await search.setValue('');
    expect(wrapper.findAll('[data-tool-panel-col-id]')).toHaveLength(4);
    wrapper.unmount();
  });
});
