import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADVANCED_FILTER_KEYWORDS,
  ADVANCED_FILTER_OPERATORS,
  ChronixFiltersToolPanel,
  OPERATORS_BY_COLUMN_TYPE,
  detectTypeaheadSlot,
  extractWordAtCursor,
  formatFilterChipLabel,
} from './chronix-filters-tool-panel.js';

import type { TableHandle } from './chronix-table.js';
import type {
  ColumnSpec,
  ColumnUniqueValue,
  FilterSpec,
  ParseFilterExpressionResult,
  RowSpec,
} from '@chronixjs/table';
import type { VueConstructor } from 'vue';

const FiltersPanelForTest = ChronixFiltersToolPanel as unknown as VueConstructor;

function makeHandle(overrides: Partial<TableHandle> = {}): TableHandle {
  const noop = (): void => undefined;
  const noopParse = (): ParseFilterExpressionResult => ({ ok: true, expression: null });
  return {
    setFilter: noop,
    clearFilter: noop,
    setAdvancedFilter: noop,
    parseAndSetAdvancedFilter: noopParse,
    ...overrides,
  } as unknown as TableHandle;
}

describe('<ChronixFiltersToolPanel> (vue2)', () => {
  const columns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'qty', field: 'qty', headerName: '数量' },
    { id: 'status', field: 'status', headerName: '状态' },
  ];

  it('renders one chip per FilterSpec entry with variant-specific labels', () => {
    const filterSpec: readonly FilterSpec[] = [
      { type: 'text', colId: 'name', operator: 'contains', value: 'foo' },
      { type: 'number', colId: 'qty', operator: '>=', value: 10 },
      { type: 'set', colId: 'status', selectedValues: ['OK', 'WIP'] },
    ];
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec },
    });
    const chips = wrapper.findAll('[data-tool-panel-chip-index]');
    expect(chips).toHaveLength(3);
    expect(chips.at(0).find('.cx-table-filters-tool-panel__chip-label').text()).toBe(
      '「名称」 包含 "foo"',
    );
    expect(chips.at(1).find('.cx-table-filters-tool-panel__chip-label').text()).toBe(
      '「数量」 >= 10',
    );
    expect(chips.at(2).find('.cx-table-filters-tool-panel__chip-label').text()).toBe(
      '「状态」 ∈ {OK, WIP}',
    );
    wrapper.destroy();
  });

  it('clicking a chip close button calls setFilter (or setAdvancedFilter for expression)', async () => {
    const setFilter = vi.fn();
    const setAdvancedFilter = vi.fn();
    const filterSpec: readonly FilterSpec[] = [
      { type: 'text', colId: 'name', operator: 'contains', value: 'foo' },
      {
        type: 'expression',
        expression: {
          kind: 'compare',
          colId: 'qty',
          operator: '>',
          value: 5,
        },
        source: 'qty > 5',
      },
    ];
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle({ setFilter, setAdvancedFilter }),
        columns,
        filterSpec,
      },
    });
    await wrapper.find('[data-testid="cx-filters-tool-panel-chip-close-0"]').trigger('click');
    expect(setFilter).toHaveBeenCalledTimes(1);
    expect(setFilter).toHaveBeenCalledWith([filterSpec[1]]);
    expect(setAdvancedFilter).not.toHaveBeenCalled();
    await wrapper.find('[data-testid="cx-filters-tool-panel-chip-close-1"]').trigger('click');
    expect(setAdvancedFilter).toHaveBeenCalledTimes(1);
    expect(setAdvancedFilter).toHaveBeenCalledWith(null);
    wrapper.destroy();
  });

  it('Clear-all button calls clearFilter AND setAdvancedFilter(null)', async () => {
    const clearFilter = vi.fn();
    const setAdvancedFilter = vi.fn();
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle({ clearFilter, setAdvancedFilter }),
        columns,
        filterSpec: [],
      },
    });
    await wrapper.find('[data-testid="cx-filters-tool-panel-clear-all"]').trigger('click');
    expect(clearFilter).toHaveBeenCalledTimes(1);
    expect(setAdvancedFilter).toHaveBeenCalledTimes(1);
    expect(setAdvancedFilter).toHaveBeenCalledWith(null);
    wrapper.destroy();
  });

  it('Apply button calls parseAndSetAdvancedFilter with the textarea content', async () => {
    const parseAndSetAdvancedFilter = vi.fn<(text: string) => ParseFilterExpressionResult>(() => ({
      ok: true,
      expression: null,
    }));
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle({ parseAndSetAdvancedFilter }),
        columns,
        filterSpec: [],
      },
    });
    const textarea = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    await textarea.setValue('name contains "foo"');
    await wrapper.find('[data-testid="cx-filters-tool-panel-advanced-apply"]').trigger('click');
    expect(parseAndSetAdvancedFilter).toHaveBeenCalledTimes(1);
    expect(parseAndSetAdvancedFilter).toHaveBeenCalledWith('name contains "foo"');
    wrapper.destroy();
  });

  it('Parse errors render below the textarea when result.ok === false', async () => {
    const parseAndSetAdvancedFilter = vi.fn<(text: string) => ParseFilterExpressionResult>(() => ({
      ok: false,
      errors: [
        { message: 'unexpected token at position 5', position: 5 },
        { message: 'missing operator', position: 12 },
      ],
    }));
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle({ parseAndSetAdvancedFilter }),
        columns,
        filterSpec: [],
      },
    });
    await wrapper
      .find('[data-testid="cx-filters-tool-panel-advanced-textarea"]')
      .setValue('bad input');
    await wrapper.find('[data-testid="cx-filters-tool-panel-advanced-apply"]').trigger('click');
    const errorList = wrapper.find('[data-testid="cx-filters-tool-panel-errors"]');
    expect(errorList.exists()).toBe(true);
    const items = errorList.findAll('li');
    expect(items).toHaveLength(2);
    expect(items.at(0).text()).toBe('unexpected token at position 5');
    expect(items.at(1).text()).toBe('missing operator');
    wrapper.destroy();
  });
});

describe('Phase 100.2: advanced filter typeahead (vue2)', () => {
  const columns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'qty', field: 'qty', headerName: '数量' },
    { id: 'status', field: 'status', headerName: '状态' },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it("100.2 (vue2): typing 'na' opens popover with name match + 'na' highlighted", async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'na';
    taEl.selectionStart = 2;
    taEl.selectionEnd = 2;
    await ta.trigger('input');
    const popover = wrapper.find('[data-testid="cx-filters-typeahead"]');
    expect(popover.exists()).toBe(true);
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items).toHaveLength(1);
    expect(items.at(0).attributes('aria-selected')).toBe('true');
    // Label is in the first span (Phase 100.2.1 layout adds a
    // category badge in the second span).
    expect(items.at(0).find('span').text()).toBe('名称');
    wrapper.destroy();
  });

  it('100.2 (vue2): ArrowDown advances active item; focus stays on textarea', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 't';
    taEl.selectionStart = 1;
    taEl.selectionEnd = 1;
    await ta.trigger('input');
    const itemsBefore = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(itemsBefore.length).toBeGreaterThanOrEqual(2);
    expect(itemsBefore.at(0).attributes('aria-selected')).toBe('true');
    await ta.trigger('keydown', { key: 'ArrowDown' });
    const itemsAfter = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(itemsAfter.at(0).attributes('aria-selected')).toBe('false');
    expect(itemsAfter.at(1).attributes('aria-selected')).toBe('true');
    wrapper.destroy();
  });

  it('100.2 (vue2): Enter commits active item — textarea replaced with col.id + trailing space (Phase 100.2.4 auto-trigger)', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'na';
    taEl.selectionStart = 2;
    taEl.selectionEnd = 2;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // Phase 100.2.4 (vue2 port): column commit appends a trailing
    // space + re-triggers the typeahead. The post-commit typeahead
    // opens for the operator slot.
    expect(taEl.value).toBe('name ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('100.2 (vue2): cursor inside open string literal suppresses popover', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name = "fo';
    taEl.selectionStart = 10;
    taEl.selectionEnd = 10;
    await ta.trigger('input');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(false);
    wrapper.destroy();
  });

  it('100.2 (vue2): click on a typeahead item commits the selection (Phase 100.2.4 trailing space)', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'na';
    taEl.selectionStart = 2;
    taEl.selectionEnd = 2;
    await ta.trigger('input');
    const item = wrapper.find('[data-testid="cx-filters-typeahead-item"]');
    expect(item.exists()).toBe(true);
    await item.trigger('click');
    await wrapper.vm.$nextTick();
    expect(taEl.value).toBe('name ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(true);
    wrapper.destroy();
  });
});

describe('Phase 100.2.1: typeahead slot detection + operator/keyword suggestions (vue2)', () => {
  const columns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'qty', field: 'qty', headerName: '数量' },
    { id: 'status', field: 'status', headerName: '状态' },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it('100.2.1 (vue2): typing in column slot suggests column items', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'na';
    taEl.selectionStart = 2;
    taEl.selectionEnd = 2;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items).toHaveLength(1);
    expect(items.at(0).attributes('data-typeahead-item-kind')).toBe('column');
    wrapper.destroy();
  });

  it('100.2.1 (vue2): typing in operator slot suggests operator items', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name c';
    taEl.selectionStart = 6;
    taEl.selectionEnd = 6;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items.at(0).attributes('data-typeahead-item-kind')).toBe('operator');
    wrapper.destroy();
  });

  it('100.2.1 (vue2): typing in conjunction slot suggests keyword items', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name = "foo" A';
    taEl.selectionStart = 14;
    taEl.selectionEnd = 14;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items.at(0).attributes('data-typeahead-item-kind')).toBe('keyword');
    wrapper.destroy();
  });

  it('100.2.1 (vue2): typing in value slot suppresses popover', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'qty = 5';
    taEl.selectionStart = 7;
    taEl.selectionEnd = 7;
    await ta.trigger('input');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(false);
    wrapper.destroy();
  });

  it('100.2.1 (vue2): Enter commits operator item + Phase 100.2.4 trailing space', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name c';
    taEl.selectionStart = 6;
    taEl.selectionEnd = 6;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(taEl.value).toBe('name contains ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(false);
    wrapper.destroy();
  });

  it('100.2.1 (vue2): Enter commits keyword item + Phase 100.2.4 trailing space', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name = "foo" A';
    taEl.selectionStart = 14;
    taEl.selectionEnd = 14;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(taEl.value).toBe('name = "foo" AND ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('100.2.1 (vue2): category badge renders per-item', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'na';
    taEl.selectionStart = 2;
    taEl.selectionEnd = 2;
    await ta.trigger('input');
    const badge = wrapper.find('.cx-filters-typeahead-item__category');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('column');
    wrapper.destroy();
  });
});

describe('Phase 100.2.3: operator subset by column type (vue2)', () => {
  const typedColumns: readonly ColumnSpec[] = [
    { id: 'status', field: 'status', headerName: 'Status', type: 'text' },
    { id: 'qty', field: 'qty', headerName: 'Qty', type: 'number' },
    { id: 'createdAt', field: 'createdAt', headerName: 'Created', type: 'date' },
    { id: 'active', field: 'active', headerName: 'Active', type: 'boolean' },
    { id: 'untyped', field: 'untyped', headerName: 'Untyped' },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it("100.2.3 (vue2): text column omits >, >= (suggest after 'status >')", async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns: typedColumns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'status >';
    ta.element.selectionStart = 8;
    ta.element.selectionEnd = 8;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const itemTexts = items.wrappers.map((i) => i.find('span').text());
    expect(itemTexts).not.toContain('>');
    expect(itemTexts).not.toContain('>=');
    wrapper.destroy();
  });

  it("100.2.3 (vue2): number column omits contains, startsWith (suggest after 'qty c')", async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns: typedColumns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'qty c';
    ta.element.selectionStart = 5;
    ta.element.selectionEnd = 5;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const itemTexts = items.wrappers.map((i) => i.find('span').text());
    expect(itemTexts).not.toContain('contains');
    expect(itemTexts).not.toContain('startsWith');
    wrapper.destroy();
  });

  it("100.2.3 (vue2): boolean column omits 'in', keeps isNull/isNotNull (suggest after 'active i')", async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns: typedColumns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'active i';
    ta.element.selectionStart = 8;
    ta.element.selectionEnd = 8;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const itemTexts = items.wrappers.map((i) => i.find('span').text());
    expect(itemTexts).not.toContain('in');
    expect(itemTexts).toContain('isNull');
    expect(itemTexts).toContain('isNotNull');
    wrapper.destroy();
  });

  it('100.2.3 (vue2): untyped column falls back to all 12 operators (backwards-compat)', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns: typedColumns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'untyped c';
    ta.element.selectionStart = 9;
    ta.element.selectionEnd = 9;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const itemTexts = items.wrappers.map((i) => i.find('span').text());
    expect(itemTexts).toContain('contains');
    wrapper.destroy();
  });

  it('100.2.3 (vue2): OPERATORS_BY_COLUMN_TYPE exports correct shape (4 keys, all subsets of ADVANCED_FILTER_OPERATORS)', () => {
    expect(Object.keys(OPERATORS_BY_COLUMN_TYPE).sort()).toEqual(
      ['boolean', 'date', 'number', 'text'].sort(),
    );
    const opSet = new Set(ADVANCED_FILTER_OPERATORS);
    for (const type of Object.keys(OPERATORS_BY_COLUMN_TYPE)) {
      for (const op of OPERATORS_BY_COLUMN_TYPE[type]!) {
        expect(opSet.has(op)).toBe(true);
      }
    }
  });
});

describe('Phase 100.2.2: value slot suggestions (vue2)', () => {
  const typedColumns: readonly ColumnSpec[] = [
    { id: 'status', field: 'status', headerName: 'Status', type: 'text' },
    { id: 'qty', field: 'qty', headerName: 'Qty', type: 'number' },
  ];
  const valueSourceRows: readonly RowSpec[] = [
    { id: 'r1', data: { status: 'open', qty: 5 } },
    { id: 'r2', data: { status: 'in-progress', qty: 10 } },
    { id: 'r3', data: { status: 'closed', qty: 5 } },
    { id: 'r4', data: { status: 'in-review', qty: 20 } },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it('100.2.2 (vue2): with advancedFilterValueSourceRows undefined, value slot still suppresses popover', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns: typedColumns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'qty = 5';
    ta.element.selectionStart = 7;
    ta.element.selectionEnd = 7;
    await ta.trigger('input');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(false);
    wrapper.destroy();
  });

  it('100.2.2 (vue2): with rows set + text column, popover opens with quoted-string value items', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: typedColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'status = i';
    ta.element.selectionStart = 10;
    ta.element.selectionEnd = 10;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items.wrappers[0]!.attributes('data-typeahead-item-kind')).toBe('value');
    const firstLabel = items.wrappers[0]!.find('span').text();
    expect(firstLabel.startsWith('"')).toBe(true);
    expect(firstLabel.endsWith('"')).toBe(true);
    wrapper.destroy();
  });

  it('100.2.2 (vue2): with rows set + number column, popover opens with bare-number value items', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: typedColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'qty > 5';
    ta.element.selectionStart = 7;
    ta.element.selectionEnd = 7;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items.wrappers[0]!.attributes('data-typeahead-item-kind')).toBe('value');
    const firstLabel = items.wrappers[0]!.find('span').text();
    expect(firstLabel.startsWith('"')).toBe(false);
    expect(firstLabel).toBe('5');
    wrapper.destroy();
  });

  it('100.2.2 (vue2): Enter commits string value with surrounding double quotes', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: typedColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'status = in-pr';
    ta.element.selectionStart = 14;
    ta.element.selectionEnd = 14;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(ta.element.value).toBe('status = "in-progress"');
    wrapper.destroy();
  });

  it('100.2.2 (vue2): Enter commits number value bare', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: typedColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'qty > 1';
    ta.element.selectionStart = 7;
    ta.element.selectionEnd = 7;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(ta.element.value).toBe('qty > 10');
    wrapper.destroy();
  });

  it('100.2.2 (vue2): category badge shows "value" for value items', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: typedColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'status = i';
    ta.element.selectionStart = 10;
    ta.element.selectionEnd = 10;
    await ta.trigger('input');
    const badge = wrapper.find('.cx-filters-typeahead-item__category');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('value');
    wrapper.destroy();
  });
});

describe('detectTypeaheadSlot (vue2)', () => {
  it('empty text or cursor at start → column slot', () => {
    expect(detectTypeaheadSlot('', 0).slot).toBe('column');
    expect(detectTypeaheadSlot('na', 0).slot).toBe('column');
  });
  it('after ( → column slot', () => {
    expect(detectTypeaheadSlot('(', 1).slot).toBe('column');
  });
  it('after , → column slot', () => {
    expect(detectTypeaheadSlot('foo,', 4).slot).toBe('column');
  });
  it('after column id + space → operator slot', () => {
    expect(detectTypeaheadSlot('name ', 5).slot).toBe('operator');
  });
  it('after comparison operator → value slot', () => {
    expect(detectTypeaheadSlot('name = ', 7).slot).toBe('value');
    expect(detectTypeaheadSlot('name contains ', 14).slot).toBe('value');
  });
  it('after closing string literal → conjunction slot', () => {
    expect(detectTypeaheadSlot('name = "foo" ', 13).slot).toBe('conjunction');
  });
  it('after numeric literal → conjunction slot', () => {
    expect(detectTypeaheadSlot('qty > 5 ', 8).slot).toBe('conjunction');
  });
  it('after isNull → conjunction slot', () => {
    expect(detectTypeaheadSlot('name isNull ', 12).slot).toBe('conjunction');
  });
  it('exports operator + keyword constants', () => {
    expect(ADVANCED_FILTER_OPERATORS.length).toBe(12);
    expect(ADVANCED_FILTER_KEYWORDS).toEqual(['AND', 'OR', 'NOT']);
  });
  // Phase 100.2.2 (2026-06-01 — vue2 port): prevColumn extraction.
  it("100.2.2 (vue2): after 'qty > ' → value slot with prevColumn='qty'", () => {
    const r = detectTypeaheadSlot('qty > ', 6);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('qty');
  });
  it("100.2.2 (vue2): after 'name = ' → value slot with prevColumn='name'", () => {
    const r = detectTypeaheadSlot('name = ', 7);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('name');
  });
  it("100.2.2 (vue2): after 'qty > 5 AND name = ' → value slot with prevColumn='name'", () => {
    const text = 'qty > 5 AND name = ';
    const r = detectTypeaheadSlot(text, text.length);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('name');
  });
  it("100.2.2 (vue2): after 'status contains ' → value slot with prevColumn='status'", () => {
    const text = 'status contains ';
    const r = detectTypeaheadSlot(text, text.length);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('status');
  });
});

describe('extractWordAtCursor (vue2)', () => {
  it('extracts word at cursor between whitespace boundaries', () => {
    const result = extractWordAtCursor('foo bar baz', 5);
    expect(result.word).toBe('bar');
  });
  it('terminates at DSL delimiter chars', () => {
    expect(extractWordAtCursor('qty>5', 3).word).toBe('qty');
  });
  it('flags cursor inside unclosed string literal', () => {
    expect(extractWordAtCursor('name = "fo', 10).isInsideStringLiteral).toBe(true);
  });
  it('does NOT flag cursor after a closed string literal', () => {
    expect(extractWordAtCursor('name = "fo" and qty', 19).isInsideStringLiteral).toBe(false);
  });
});

describe('Phase 100.2.2.2: histogram count badge per value (vue2)', () => {
  const typedColumns: readonly ColumnSpec[] = [
    { id: 'status', field: 'status', headerName: 'Status', type: 'text' },
    { id: 'qty', field: 'qty', headerName: 'Qty', type: 'number' },
  ];
  const valueSourceRows: readonly RowSpec[] = [
    { id: 'r1', data: { status: 'open', qty: 5 } },
    { id: 'r2', data: { status: 'in-progress', qty: 10 } },
    { id: 'r3', data: { status: 'open', qty: 5 } },
    { id: 'r4', data: { status: 'in-progress', qty: 20 } },
    { id: 'r5', data: { status: 'in-progress', qty: 10 } },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it('100.2.2.2 (vue2): value-slot popover (text column) shows (N) count badge per item', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: typedColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'status = i';
    taEl.selectionStart = 10;
    taEl.selectionEnd = 10;
    await ta.trigger('input');
    const counts = wrapper.findAll('[data-testid="cx-filters-typeahead-item-count"]');
    expect(counts.length).toBeGreaterThan(0);
    expect(counts.at(0).text()).toBe('(3)');
    wrapper.destroy();
  });

  it('100.2.2.2 (vue2): value-slot popover (number column) shows (N) count badge per item', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: typedColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'qty > 1';
    taEl.selectionStart = 7;
    taEl.selectionEnd = 7;
    await ta.trigger('input');
    const counts = wrapper.findAll('[data-testid="cx-filters-typeahead-item-count"]');
    expect(counts.length).toBeGreaterThan(0);
    expect(counts.at(0).text()).toBe('(2)');
    wrapper.destroy();
  });

  it('100.2.2.2 (vue2): column / operator / keyword items do NOT show a count badge (backwards-compat)', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: typedColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'st';
    taEl.selectionStart = 2;
    taEl.selectionEnd = 2;
    await ta.trigger('input');
    const counts = wrapper.findAll('[data-testid="cx-filters-typeahead-item-count"]');
    expect(counts.length).toBe(0);
    wrapper.destroy();
  });
});

describe('Phase 100.2.2.3: date-typed value formatter (vue2)', () => {
  const dateColumns: readonly ColumnSpec[] = [
    { id: 'createdAt', field: 'createdAt', headerName: 'Created', type: 'date' },
    { id: 'qty', field: 'qty', headerName: 'Qty', type: 'number' },
  ];
  const dateValueSourceRows: readonly RowSpec[] = [
    { id: 'r1', data: { createdAt: new Date('2024-01-15T00:00:00Z'), qty: 5 } },
    { id: 'r2', data: { createdAt: new Date('2024-02-20T00:00:00Z'), qty: 10 } },
    { id: 'r3', data: { createdAt: new Date('2024-03-25T00:00:00Z'), qty: 15 } },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it('100.2.2.3 (vue2): with formatTypeaheadDateValue undefined, date column shows raw ISO strings (backwards-compat)', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: dateColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: dateValueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'createdAt = 2';
    taEl.selectionStart = 13;
    taEl.selectionEnd = 13;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstLabel = items.at(0).find('span').text();
    expect(firstLabel).toContain('2024-01-15');
    expect(firstLabel).toContain('T00:00:00');
    wrapper.destroy();
  });

  it('100.2.2.3 (vue2): with formatTypeaheadDateValue set, date column shows formatted labels', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: dateColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: dateValueSourceRows,
        formatTypeaheadDateValue: (iso: string) => iso.slice(0, 10),
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'createdAt = 2';
    taEl.selectionStart = 13;
    taEl.selectionEnd = 13;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstLabel = items.at(0).find('span').text();
    expect(firstLabel).toBe('"2024-01-15"');
    expect(firstLabel).not.toContain('T00:00:00');
    wrapper.destroy();
  });

  it('100.2.2.3 (vue2): commit inserts the raw ISO-quoted string regardless of formatter (DSL-correct)', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: dateColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: dateValueSourceRows,
        formatTypeaheadDateValue: (iso: string) => iso.slice(0, 10),
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'createdAt = 2024-01-15';
    taEl.selectionStart = 22;
    taEl.selectionEnd = 22;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(taEl.value).toContain('"2024-01-15T00:00:00.000Z"');
    wrapper.destroy();
  });

  it('100.2.2.3 (vue2): formatter NOT called for non-date columns', async () => {
    const formatter = vi.fn<(iso: string) => string>((iso) => iso.slice(0, 10));
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: dateColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: dateValueSourceRows,
        formatTypeaheadDateValue: formatter,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'qty > 1';
    taEl.selectionStart = 7;
    taEl.selectionEnd = 7;
    await ta.trigger('input');
    expect(formatter).not.toHaveBeenCalled();
    wrapper.destroy();
  });
});

describe('Phase 100.2.3.1: custom column-type operator override (vue2)', () => {
  const customColumns: readonly ColumnSpec[] = [
    { id: 'price', field: 'price', headerName: 'Price', type: 'currency' },
    { id: 'status', field: 'status', headerName: 'Status', type: 'text' },
    { id: 'qty', field: 'qty', headerName: 'Qty', type: 'number' },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it('100.2.3.1 (vue2): with operatorsByCustomColumnType undefined, unrecognized type falls back to all 12 (backwards-compat)', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns: customColumns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'price c';
    taEl.selectionStart = 7;
    taEl.selectionEnd = 7;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const containsExists = items.wrappers.some((i) => i.text().startsWith('contains'));
    expect(containsExists).toBe(true);
    wrapper.destroy();
  });

  it('100.2.3.1 (vue2): with operatorsByCustomColumnType set for custom type, list uses consumer-provided operators', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: customColumns,
        filterSpec: [],
        operatorsByCustomColumnType: {
          currency: ['=', '!=', '>', '<', '>=', '<='],
        },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'price c';
    taEl.selectionStart = 7;
    taEl.selectionEnd = 7;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const containsExists = items.wrappers.some((i) => i.text().startsWith('contains'));
    expect(containsExists).toBe(false);
    wrapper.destroy();
  });

  it('100.2.3.1 (vue2): with operatorsByCustomColumnType overriding built-in (text), consumer dict wins', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: customColumns,
        filterSpec: [],
        operatorsByCustomColumnType: {
          text: ['=', '!=', 'isNotNull'],
        },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'status is';
    taEl.selectionStart = 9;
    taEl.selectionEnd = 9;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBe(1);
    expect(items.at(0).find('span').text()).toBe('isNotNull');
    wrapper.destroy();
  });

  it('100.2.3.1 (vue2): built-in number column unchanged when consumer dict only covers custom types', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: customColumns,
        filterSpec: [],
        operatorsByCustomColumnType: {
          currency: ['=', '!=', '>', '<'],
        },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'qty c';
    taEl.selectionStart = 5;
    taEl.selectionEnd = 5;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const containsExists = items.wrappers.some((i) => i.text().startsWith('contains'));
    expect(containsExists).toBe(false);
    wrapper.destroy();
  });
});

describe('Phase 100.2.3.2: localized operator labels (vue2)', () => {
  const columns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'qty', field: 'qty', headerName: '数量', type: 'number' },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it('100.2.3.2 (vue2): with operatorLabels undefined, operator items show literal DSL keys (backwards-compat)', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name c';
    taEl.selectionStart = 6;
    taEl.selectionEnd = 6;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items.at(0).find('span').text()).toBe('contains');
    wrapper.destroy();
  });

  it('100.2.3.2 (vue2): with operatorLabels set for matching key, operator shows localized label', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        operatorLabels: { contains: '包含', '>=': '大于等于' },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name c';
    taEl.selectionStart = 6;
    taEl.selectionEnd = 6;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items.at(0).find('span').text()).toBe('包含');
    wrapper.destroy();
  });

  it('100.2.3.2 (vue2): with operatorLabels set but non-matching key, falls back to DSL key', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        operatorLabels: { '>=': '大于等于' },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name c';
    taEl.selectionStart = 6;
    taEl.selectionEnd = 6;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items.at(0).find('span').text()).toBe('contains');
    wrapper.destroy();
  });

  it('100.2.3.2 (vue2): commit inserts the DSL key regardless of label (parser-correct)', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        operatorLabels: { contains: '包含' },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name c';
    taEl.selectionStart = 6;
    taEl.selectionEnd = 6;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(taEl.value).toBe('name contains ');
    wrapper.destroy();
  });

  it('100.2.3.2 (vue2): substring match against the typed query uses the DSL key', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        operatorLabels: { contains: '包含' },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name contains';
    taEl.selectionStart = 13;
    taEl.selectionEnd = 13;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items.at(0).attributes('data-typeahead-item-kind')).toBe('operator');
    wrapper.destroy();
  });
});

describe('Phase 100.2.4: auto-trigger after operator commit (vue2)', () => {
  const columns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'qty', field: 'qty', headerName: '数量' },
  ];
  const valueSourceRows: readonly RowSpec[] = [
    { id: 'r1', data: { name: 'alice', qty: 5 } },
    { id: 'r2', data: { name: 'bob', qty: 10 } },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it('100.2.4 (vue2): column commit appends trailing space + auto-opens typeahead for operator slot', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'na';
    taEl.selectionStart = 2;
    taEl.selectionEnd = 2;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(taEl.value).toBe('name ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(true);
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.at(0).attributes('data-typeahead-item-kind')).toBe('operator');
    wrapper.destroy();
  });

  it('100.2.4 (vue2): operator commit appends trailing space + auto-opens typeahead for value slot', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name c';
    taEl.selectionStart = 6;
    taEl.selectionEnd = 6;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(taEl.value).toBe('name contains ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(true);
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.at(0).attributes('data-typeahead-item-kind')).toBe('value');
    wrapper.destroy();
  });

  it('100.2.4 (vue2): keyword commit appends trailing space + auto-opens typeahead for column slot', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name = "foo" A';
    taEl.selectionStart = 14;
    taEl.selectionEnd = 14;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(taEl.value).toBe('name = "foo" AND ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(true);
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.at(0).attributes('data-typeahead-item-kind')).toBe('column');
    wrapper.destroy();
  });

  it('100.2.4 (vue2): value commit does NOT append trailing space + typeahead closes (Decision I.1)', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'name = a';
    taEl.selectionStart = 8;
    taEl.selectionEnd = 8;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(taEl.value).toBe('name = "alice"');
    expect(taEl.value.endsWith(' ')).toBe(false);
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(false);
    wrapper.destroy();
  });
});

describe('Phase 100.2.6: auto-scroll active item into view (vue2)', () => {
  const manyColumns: readonly ColumnSpec[] = Array.from({ length: 30 }, (_, i) => ({
    id: `col${i}`,
    field: `col${i}`,
    headerName: `Col${i}`,
  }));

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it('100.2.6 (vue2): arrow-down past visible threshold triggers scrollIntoView with { block: nearest }', async () => {
    const scrollSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollSpy;
    try {
      const wrapper = mount(FiltersPanelForTest, {
        propsData: { tableHandle: makeHandle(), columns: manyColumns, filterSpec: [] },
        attachTo: document.body,
      });
      const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
      const taEl = ta.element as HTMLTextAreaElement;
      stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
      taEl.value = 'c';
      taEl.selectionStart = 1;
      taEl.selectionEnd = 1;
      await ta.trigger('input');
      scrollSpy.mockClear();
      await ta.trigger('keydown', { key: 'ArrowDown' });
      await wrapper.vm.$nextTick();
      expect(scrollSpy).toHaveBeenCalled();
      const lastCall = scrollSpy.mock.calls[scrollSpy.mock.calls.length - 1];
      expect(lastCall?.[0]).toEqual({ block: 'nearest', behavior: 'auto' });
      wrapper.destroy();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it('100.2.6 (vue2): typeahead open with activeIdx = 0 triggers scroll-into-view (first item)', async () => {
    const scrollSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollSpy;
    try {
      const wrapper = mount(FiltersPanelForTest, {
        propsData: { tableHandle: makeHandle(), columns: manyColumns, filterSpec: [] },
        attachTo: document.body,
      });
      const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
      const taEl = ta.element as HTMLTextAreaElement;
      stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
      taEl.value = 'c';
      taEl.selectionStart = 1;
      taEl.selectionEnd = 1;
      await ta.trigger('input');
      expect(scrollSpy).toHaveBeenCalled();
      wrapper.destroy();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it('100.2.6 (vue2): typeahead closed does NOT trigger scroll-into-view', async () => {
    const scrollSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollSpy;
    try {
      const wrapper = mount(FiltersPanelForTest, {
        propsData: { tableHandle: makeHandle(), columns: manyColumns, filterSpec: [] },
        attachTo: document.body,
      });
      const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
      const taEl = ta.element as HTMLTextAreaElement;
      stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
      taEl.value = 'name = "fo';
      taEl.selectionStart = 10;
      taEl.selectionEnd = 10;
      await ta.trigger('input');
      expect(scrollSpy).not.toHaveBeenCalled();
      wrapper.destroy();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });
});

describe('Phase 100.2.2.4: string-literal-internal typeahead (vue2)', () => {
  const typedColumns: readonly ColumnSpec[] = [
    { id: 'status', field: 'status', headerName: 'Status', type: 'text' },
    { id: 'qty', field: 'qty', headerName: 'Qty', type: 'number' },
  ];
  const valueSourceRows: readonly RowSpec[] = [
    { id: 'r1', data: { status: 'in-progress', qty: 5 } },
    { id: 'r2', data: { status: 'in-review', qty: 10 } },
    { id: 'r3', data: { status: 'closed', qty: 15 } },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it('100.2.2.4 (vue2): cursor inside open string literal after `=` opens value typeahead', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: typedColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'status = "in';
    taEl.selectionStart = 12;
    taEl.selectionEnd = 12;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items.at(0).attributes('data-typeahead-item-kind')).toBe('value');
    wrapper.destroy();
  });

  it('100.2.2.4 (vue2): commit inside open string literal inserts bare-value + closing `"`', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: typedColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'status = "in-pr';
    taEl.selectionStart = 15;
    taEl.selectionEnd = 15;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(taEl.value).toBe('status = "in-progress"');
    wrapper.destroy();
  });

  it('100.2.2.4 (vue2): after closed " AND " (no comparison op) popover does NOT open', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns: typedColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'status = "foo" AND "ba';
    taEl.selectionStart = 22;
    taEl.selectionEnd = 22;
    await ta.trigger('input');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(false);
    wrapper.destroy();
  });

  it('100.2.2.4 (vue2): detectTypeaheadSlot returns slot=value with prevColumn for `name = "in`', () => {
    const r = detectTypeaheadSlot('name = "in', 10);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('name');
  });

  it('100.2.2.4 (vue2): detectTypeaheadSlot returns slot=conjunction for closing quote', () => {
    const r = detectTypeaheadSlot('name = "foo" ', 13);
    expect(r.slot).toBe('conjunction');
  });
});

describe('Phase 100.2.5: per-slot recent LRU rings (vue2)', () => {
  const columns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'qty', field: 'qty', headerName: '数量' },
    { id: 'status', field: 'status', headerName: '状态' },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  it('100.2.5 (vue2): column commit → next column typeahead shows it at TOP with recent badge', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'q';
    taEl.selectionStart = 1;
    taEl.selectionEnd = 1;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    taEl.value = 'qty AND q';
    taEl.selectionStart = 9;
    taEl.selectionEnd = 9;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstRecentBadge = items.at(0).find('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(firstRecentBadge.exists()).toBe(true);
    wrapper.destroy();
  });

  it('100.2.5 (vue2): typeaheadRecentLimit=0 disables the feature entirely', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [], typeaheadRecentLimit: 0 },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'q';
    taEl.selectionStart = 1;
    taEl.selectionEnd = 1;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    taEl.value = 'qty AND q';
    taEl.selectionStart = 9;
    taEl.selectionEnd = 9;
    await ta.trigger('input');
    const recentBadges = wrapper.findAll('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(recentBadges.length).toBe(0);
    wrapper.destroy();
  });

  it('100.2.5 (vue2): cross-slot isolation — recent column does NOT appear in operator slot', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'q';
    taEl.selectionStart = 1;
    taEl.selectionEnd = 1;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    taEl.value = 'qty c';
    taEl.selectionStart = 5;
    taEl.selectionEnd = 5;
    await ta.trigger('input');
    const recentBadges = wrapper.findAll('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(recentBadges.length).toBe(0);
    wrapper.destroy();
  });
});

describe('Phase 100.2.2.1: SSR async value getter (vue2)', () => {
  const columns: readonly ColumnSpec[] = [
    { id: 'status', field: 'status', headerName: 'Status', type: 'text' },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  function flushPromises(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  it('100.2.2.1 (vue2): getter called with (colId, query) on value-slot input', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.resolve([{ value: 'in-progress', count: 5 }]));
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'status = i';
    taEl.selectionStart = 10;
    taEl.selectionEnd = 10;
    await ta.trigger('input');
    // Phase 118 (2026-06-02 — vue2 port): getter widened with
    // optional 3rd `signal?: AbortSignal` arg.
    expect(getter).toHaveBeenCalledWith('status', 'i', expect.any(AbortSignal));
    wrapper.destroy();
  });

  it('100.2.2.1 (vue2): loading placeholder rendered before promise resolves', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => new Promise(() => undefined));
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'status = i';
    taEl.selectionStart = 10;
    taEl.selectionEnd = 10;
    await ta.trigger('input');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="cx-filters-typeahead-loading"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('100.2.2.1 (vue2): resolved values render as value-kind items', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.resolve([{ value: 'in-progress', count: 5 }]));
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'status = i';
    taEl.selectionStart = 10;
    taEl.selectionEnd = 10;
    await ta.trigger('input');
    await flushPromises();
    await wrapper.vm.$nextTick();
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items.at(0).attributes('data-typeahead-item-kind')).toBe('value');
    wrapper.destroy();
  });

  it('100.2.2.1 (vue2): error placeholder rendered on promise rejection', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.reject(new Error('network')));
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'status = i';
    taEl.selectionStart = 10;
    taEl.selectionEnd = 10;
    await ta.trigger('input');
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="cx-filters-typeahead-error"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('100.2.2.1 (vue2): cache hit on second-time same (colId, query)', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.resolve([{ value: 'in-progress', count: 5 }]));
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'status = i';
    taEl.selectionStart = 10;
    taEl.selectionEnd = 10;
    await ta.trigger('input');
    await flushPromises();
    expect(getter).toHaveBeenCalledTimes(1);
    await ta.trigger('input');
    await flushPromises();
    expect(getter).toHaveBeenCalledTimes(1);
    wrapper.destroy();
  });
});

describe('Phase 112: persistent typeahead recent (vue2)', () => {
  const columns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'qty', field: 'qty', headerName: '数量' },
  ];

  function stubAnchor(ta: HTMLTextAreaElement, rect: Partial<DOMRect>): void {
    const full: DOMRect = {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 80,
      width: 200,
      height: 80,
      toJSON: () => ({}),
      ...rect,
    };
    ta.getBoundingClientRect = (): DOMRect => full;
  }

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('112 (vue2): memory backend default does NOT write to localStorage', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'q';
    taEl.selectionStart = 1;
    taEl.selectionEnd = 1;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(window.localStorage.getItem('cx-table-typeahead-recent::column')).toBeNull();
    wrapper.destroy();
  });

  it('112 (vue2): localStorage backend writes ring on commit', async () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        typeaheadRecentStorage: 'localStorage',
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'q';
    taEl.selectionStart = 1;
    taEl.selectionEnd = 1;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(window.localStorage.getItem('cx-table-typeahead-recent::column')).toBe('["qty"]');
    wrapper.destroy();
  });

  it('112 (vue2): localStorage backend hydrates on mount', async () => {
    window.localStorage.setItem('cx-table-typeahead-recent::column', '["qty","name"]');
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        typeaheadRecentStorage: 'localStorage',
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'q';
    taEl.selectionStart = 1;
    taEl.selectionEnd = 1;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstRecentBadge = items.at(0).find('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(firstRecentBadge.exists()).toBe(true);
    wrapper.destroy();
  });

  it('112 (vue2): localStorage backend ignores malformed payload', async () => {
    window.localStorage.setItem('cx-table-typeahead-recent::column', '{not-json');
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        typeaheadRecentStorage: 'localStorage',
      },
      attachTo: document.body,
    });
    const ta = wrapper.find('[data-testid="cx-filters-tool-panel-advanced-textarea"]');
    const taEl = ta.element as HTMLTextAreaElement;
    stubAnchor(taEl, { left: 10, bottom: 100, width: 200 });
    taEl.value = 'q';
    taEl.selectionStart = 1;
    taEl.selectionEnd = 1;
    await ta.trigger('input');
    const recentBadges = wrapper.findAll('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(recentBadges.length).toBe(0);
    wrapper.destroy();
  });
});

describe('formatFilterChipLabel (vue2)', () => {
  const columns: readonly ColumnSpec[] = [{ id: 'qty', field: 'qty', headerName: '数量' }];

  it('formats set filter with truncated values when more than 3 entries', () => {
    expect(
      formatFilterChipLabel(
        { type: 'set', colId: 'qty', selectedValues: ['a', 'b', 'c', 'd', 'e'] },
        columns,
      ),
    ).toBe('「数量」 ∈ {a, b, c, …+2 more}');
  });

  it('formats inRange number filter with [value, valueTo]', () => {
    expect(
      formatFilterChipLabel(
        { type: 'number', colId: 'qty', operator: 'inRange', value: 1, valueTo: 10 },
        columns,
      ),
    ).toBe('「数量」 ∈ [1, 10]');
  });
});

describe('Phase 118: P3 finale — AbortController + per-column recents (vue2)', () => {
  const phase118Columns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name' },
    { id: 'qty', field: 'qty', headerName: 'Qty', type: 'number' },
    { id: 'status', field: 'status', headerName: 'Status' },
  ];
  const phase118Handle = makeHandle();

  it('Phase 118 (vue2): getter receives an AbortSignal arg', async () => {
    const getter = vi.fn<
      (colId: string, query: string, signal?: AbortSignal) => Promise<readonly ColumnUniqueValue[]>
    >(() => Promise.resolve([{ value: 'OK', count: 1 }]));
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: phase118Handle,
        columns: phase118Columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
      },
    });
    const ta = wrapper.find('textarea');
    const taEl = ta.element as HTMLTextAreaElement;
    taEl.value = 'status = a';
    taEl.selectionStart = 10;
    taEl.selectionEnd = 10;
    await ta.trigger('input');
    expect(getter).toHaveBeenCalled();
    const args = getter.mock.calls[0]!;
    expect(args[0]).toBe('status');
    expect(args[1]).toBe('a');
    expect(args[2]).toBeInstanceOf(AbortSignal);
    wrapper.destroy();
  });

  it('Phase 118 (vue2): rapid typing aborts the prior in-flight controller', async () => {
    const signals: AbortSignal[] = [];
    const getter = vi.fn((_colId: string, _query: string, signal?: AbortSignal) => {
      if (signal != null) signals.push(signal);
      return new Promise<readonly ColumnUniqueValue[]>(() => undefined);
    });
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: phase118Handle,
        columns: phase118Columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
      },
    });
    const ta = wrapper.find('textarea');
    const taEl = ta.element as HTMLTextAreaElement;
    taEl.value = 'status = a';
    taEl.selectionStart = 10;
    taEl.selectionEnd = 10;
    await ta.trigger('input');
    taEl.value = 'status = ab';
    taEl.selectionStart = 11;
    taEl.selectionEnd = 11;
    await ta.trigger('input');
    expect(signals.length).toBeGreaterThanOrEqual(2);
    expect(getter).toHaveBeenCalledTimes(2);
    wrapper.destroy();
  });

  it('Phase 118 (vue2): typeaheadRecentScope="per-column-value" mounts cleanly', () => {
    const wrapper = mount(FiltersPanelForTest, {
      propsData: {
        tableHandle: phase118Handle,
        columns: phase118Columns,
        filterSpec: [],
        typeaheadRecentScope: 'per-column-value',
      },
    });
    expect(wrapper.props()['typeaheadRecentScope']).toBe('per-column-value');
    wrapper.destroy();
  });
});
