/**
 * Phase 81 (2026-05-30): pre-built columns tool panel — a vue3
 * functional component the consumer drops into Phase 80's
 * `ToolPanelDescriptor.renderer` slot.
 *
 * Pure UI wrapper over `TableHandle.toggleColumnVisibility` +
 * `TableHandle.setColumnVisibility`. State is consumer-mirrored —
 * the panel reads each column's current visibility from
 * `props.columns[].hide` (the consumer rebuilds `columns` on each
 * `column-visibility-change` emit from `<ChronixTable>`).
 *
 * 3-zone layout per design B.1: sticky header (search input) +
 * scrollable body (one row per column with checkbox + label) +
 * sticky footer (Show all / Hide all bulk-action buttons).
 */
import { defineComponent, h, ref, computed, type PropType } from 'vue';

import type { ColumnSpec } from '@chronixjs/table';

import type { TableHandle } from './chronix-table.js';

/**
 * Props for `<ChronixColumnsToolPanel>`.
 */
export interface ChronixColumnsToolPanelProps {
  /**
   * Imperative handle of the parent `<ChronixTable>`. The panel
   * dispatches visibility toggles via `tableHandle.toggleColumnVisibility`
   * / `tableHandle.setColumnVisibility`. May be `null` before mount.
   */
  readonly tableHandle: TableHandle | null;

  /**
   * Reactive mirror of `<ChronixTable>`'s `columns` prop. Drives
   * the panel's checkbox list + checked state (via `column.hide`).
   * Consumer keeps this in sync via the `column-visibility-change`
   * emit.
   */
  readonly columns: readonly ColumnSpec[];
}

export const ChronixColumnsToolPanel = defineComponent({
  name: 'ChronixColumnsToolPanel',
  props: {
    tableHandle: {
      type: Object as PropType<TableHandle | null>,
      default: null,
    },
    columns: {
      type: Array as PropType<readonly ColumnSpec[]>,
      required: true,
    },
  },
  setup(props) {
    const searchText = ref('');

    const filteredColumns = computed(() => {
      const q = searchText.value.trim().toLowerCase();
      if (q === '') return props.columns;
      return props.columns.filter((c) => {
        const label = c.headerName ?? c.id;
        return label.toLowerCase().includes(q);
      });
    });

    function onToggle(colId: string): void {
      props.tableHandle?.toggleColumnVisibility(colId);
    }

    function setAll(hidden: boolean): void {
      const handle = props.tableHandle;
      if (handle == null) return;
      for (const col of props.columns) {
        handle.setColumnVisibility(col.id, hidden);
      }
    }

    return () =>
      h('div', { class: 'cx-table-columns-tool-panel' }, [
        h('div', { class: 'cx-table-columns-tool-panel__header' }, [
          h('input', {
            class: 'cx-table-columns-tool-panel__search',
            type: 'text',
            placeholder: '搜索列…',
            value: searchText.value,
            'data-testid': 'cx-columns-tool-panel-search',
            onInput: (e: Event) => {
              searchText.value = (e.target as HTMLInputElement).value;
            },
          }),
        ]),
        h(
          'div',
          { class: 'cx-table-columns-tool-panel__body' },
          filteredColumns.value.map((col) =>
            h(
              'label',
              {
                key: col.id,
                class: 'cx-table-columns-tool-panel__row',
                'data-tool-panel-col-id': col.id,
              },
              [
                h('input', {
                  class: 'cx-table-columns-tool-panel__checkbox',
                  type: 'checkbox',
                  checked: col.hide !== true,
                  onChange: () => onToggle(col.id),
                }),
                h(
                  'span',
                  { class: 'cx-table-columns-tool-panel__label' },
                  col.headerName ?? col.id,
                ),
              ],
            ),
          ),
        ),
        h('div', { class: 'cx-table-columns-tool-panel__footer' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'cx-table-columns-tool-panel__bulk-action',
              'data-testid': 'cx-columns-tool-panel-show-all',
              onClick: () => setAll(false),
            },
            '全部显示',
          ),
          h(
            'button',
            {
              type: 'button',
              class: 'cx-table-columns-tool-panel__bulk-action',
              'data-testid': 'cx-columns-tool-panel-hide-all',
              onClick: () => setAll(true),
            },
            '全部隐藏',
          ),
        ]),
      ]);
  },
});
