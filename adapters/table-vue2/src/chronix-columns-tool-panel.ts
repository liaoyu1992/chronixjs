/**
 * Phase 81 (2026-05-30 — vue2 port): pre-built columns tool panel
 * SFC. Vue 2.7 verbatim mirror of the vue3 adapter using vnode-data
 * `attrs:` + `on:` deltas instead of vue3's flat prop bag.
 *
 * Pure UI wrapper over `TableHandle.toggleColumnVisibility` +
 * `TableHandle.setColumnVisibility`. State is consumer-mirrored.
 */
import { computed, defineComponent, h, ref } from 'vue';

import type { ColumnSpec } from '@chronixjs/table';
import type { PropType } from 'vue';

import type { TableHandle } from './chronix-table.js';

export interface ChronixColumnsToolPanelProps {
  readonly tableHandle: TableHandle | null;
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
            attrs: {
              type: 'text',
              placeholder: '搜索列…',
              'data-testid': 'cx-columns-tool-panel-search',
            },
            domProps: { value: searchText.value },
            on: {
              input: (e: Event) => {
                searchText.value = (e.target as HTMLInputElement).value;
              },
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
                attrs: { 'data-tool-panel-col-id': col.id },
              },
              [
                h('input', {
                  class: 'cx-table-columns-tool-panel__checkbox',
                  attrs: { type: 'checkbox' },
                  domProps: { checked: col.hide !== true },
                  on: {
                    change: () => onToggle(col.id),
                  },
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
              class: 'cx-table-columns-tool-panel__bulk-action',
              attrs: {
                type: 'button',
                'data-testid': 'cx-columns-tool-panel-show-all',
              },
              on: {
                click: () => setAll(false),
              },
            },
            '全部显示',
          ),
          h(
            'button',
            {
              class: 'cx-table-columns-tool-panel__bulk-action',
              attrs: {
                type: 'button',
                'data-testid': 'cx-columns-tool-panel-hide-all',
              },
              on: {
                click: () => setAll(true),
              },
            },
            '全部隐藏',
          ),
        ]),
      ]);
  },
});
