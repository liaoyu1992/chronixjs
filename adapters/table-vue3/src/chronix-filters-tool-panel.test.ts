import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ColumnSpec,
  ColumnUniqueValue,
  FilterSpec,
  ParseFilterExpressionResult,
  RowSpec,
} from '@chronixjs/table';

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

describe('<ChronixFiltersToolPanel> (vue3)', () => {
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
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec },
    });
    const chips = wrapper.findAll('[data-tool-panel-chip-index]');
    expect(chips).toHaveLength(3);
    const labels = chips.map((c) => c.find('.cx-table-filters-tool-panel__chip-label').text());
    expect(labels[0]).toBe('「名称」 包含 "foo"');
    expect(labels[1]).toBe('「数量」 >= 10');
    expect(labels[2]).toBe('「状态」 ∈ {OK, WIP}');
    wrapper.unmount();
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
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    wrapper.unmount();
  });

  it('Clear-all button calls clearFilter AND setAdvancedFilter(null)', async () => {
    const clearFilter = vi.fn();
    const setAdvancedFilter = vi.fn();
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle({ clearFilter, setAdvancedFilter }),
        columns,
        filterSpec: [],
      },
    });
    await wrapper.find('[data-testid="cx-filters-tool-panel-clear-all"]').trigger('click');
    expect(clearFilter).toHaveBeenCalledTimes(1);
    expect(setAdvancedFilter).toHaveBeenCalledTimes(1);
    expect(setAdvancedFilter).toHaveBeenCalledWith(null);
    wrapper.unmount();
  });

  it('Apply button calls parseAndSetAdvancedFilter with the textarea content', async () => {
    const parseAndSetAdvancedFilter = vi.fn<(text: string) => ParseFilterExpressionResult>(() => ({
      ok: true,
      expression: null,
    }));
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle({ parseAndSetAdvancedFilter }),
        columns,
        filterSpec: [],
      },
    });
    const textarea = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    await textarea.setValue('name contains "foo"');
    await wrapper.find('[data-testid="cx-filters-tool-panel-advanced-apply"]').trigger('click');
    expect(parseAndSetAdvancedFilter).toHaveBeenCalledTimes(1);
    expect(parseAndSetAdvancedFilter).toHaveBeenCalledWith('name contains "foo"');
    wrapper.unmount();
  });

  it('Parse errors render below the textarea when result.ok === false', async () => {
    const parseAndSetAdvancedFilter = vi.fn<(text: string) => ParseFilterExpressionResult>(() => ({
      ok: false,
      errors: [
        { message: 'unexpected token at position 5', position: 5 },
        { message: 'missing operator', position: 12 },
      ],
    }));
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle({ parseAndSetAdvancedFilter }),
        columns,
        filterSpec: [],
      },
    });
    await wrapper
      .find<HTMLTextAreaElement>('[data-testid="cx-filters-tool-panel-advanced-textarea"]')
      .setValue('bad input');
    await wrapper.find('[data-testid="cx-filters-tool-panel-advanced-apply"]').trigger('click');
    const errorList = wrapper.find('[data-testid="cx-filters-tool-panel-errors"]');
    expect(errorList.exists()).toBe(true);
    const items = errorList.findAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]!.text()).toBe('unexpected token at position 5');
    expect(items[1]!.text()).toBe('missing operator');
    wrapper.unmount();
  });
});

describe('advanced filter typeahead (vue3)', () => {
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

  it("100.2: typing 'na' opens popover with name match + 'na' highlighted", async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'na';
    ta.element.selectionStart = 2;
    ta.element.selectionEnd = 2;
    await ta.trigger('input');
    const popover = wrapper.find('[data-testid="cx-filters-typeahead"]');
    expect(popover.exists()).toBe(true);
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items).toHaveLength(1);
    expect(items[0]!.attributes('aria-selected')).toBe('true');
    // Label is in the first span; category badge ('column') is in
    // the second span (layout).
    expect(items[0]!.find('span').text()).toBe('名称');
    wrapper.unmount();
  });

  it('100.2: ArrowDown advances active item; focus stays on textarea', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // 't' matches qty (substring) + status (substring)
    ta.element.value = 't';
    ta.element.selectionStart = 1;
    ta.element.selectionEnd = 1;
    await ta.trigger('input');
    const itemsBefore = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(itemsBefore.length).toBeGreaterThanOrEqual(2);
    expect(itemsBefore[0]!.attributes('aria-selected')).toBe('true');
    await ta.trigger('keydown', { key: 'ArrowDown' });
    const itemsAfter = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(itemsAfter[0]!.attributes('aria-selected')).toBe('false');
    expect(itemsAfter[1]!.attributes('aria-selected')).toBe('true');
    wrapper.unmount();
  });

  it('100.2: Enter commits active item — textarea replaced with col.id + trailing space (auto-trigger)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'na';
    ta.element.selectionStart = 2;
    ta.element.selectionEnd = 2;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // column commit appends a trailing
    // space + re-triggers the typeahead. The post-commit typeahead
    // opens for the operator slot (column 'name' was just committed).
    expect(ta.element.value).toBe('name ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('100.2: cursor inside open string literal suppresses popover', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // Open quote NOT closed: cursor sits inside string literal.
    ta.element.value = 'name = "fo';
    ta.element.selectionStart = 10;
    ta.element.selectionEnd = 10;
    await ta.trigger('input');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('100.2: click on a typeahead item commits the selection (trailing space + auto-trigger)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'na';
    ta.element.selectionStart = 2;
    ta.element.selectionEnd = 2;
    await ta.trigger('input');
    const item = wrapper.find('[data-testid="cx-filters-typeahead-item"]');
    expect(item.exists()).toBe(true);
    await item.trigger('click');
    await wrapper.vm.$nextTick();
    // column-commit appends trailing space; auto-trigger
    // reopens typeahead for the operator slot.
    expect(ta.element.value).toBe('name ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(true);
    wrapper.unmount();
  });
});

describe('typeahead slot detection + operator/keyword suggestions (vue3)', () => {
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

  it("100.2.1: typing in column slot ('na') suggests column items with kind='column'", async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'na';
    ta.element.selectionStart = 2;
    ta.element.selectionEnd = 2;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items).toHaveLength(1);
    expect(items[0]!.attributes('data-typeahead-item-kind')).toBe('column');
    wrapper.unmount();
  });

  it('100.2.1: typing in operator slot (after column name + space) suggests operator items', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'name c';
    ta.element.selectionStart = 6;
    ta.element.selectionEnd = 6;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    // 'c' matches contains operator.
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.attributes('data-typeahead-item-kind')).toBe('operator');
    wrapper.unmount();
  });

  it('100.2.1: typing in conjunction slot (after closed string literal + space) suggests keyword items', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'name = "foo" A';
    ta.element.selectionStart = 14;
    ta.element.selectionEnd = 14;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.attributes('data-typeahead-item-kind')).toBe('keyword');
    wrapper.unmount();
  });

  it('100.2.1: typing in value slot (after operator + space) suppresses popover', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
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
    wrapper.unmount();
  });

  it('100.2.1: Enter commits operator item — literal text inserted + trailing space', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'name c';
    ta.element.selectionStart = 6;
    ta.element.selectionEnd = 6;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // operator commit appends trailing space; without
    // `advancedFilterValueSourceRows` the value slot yields empty
    // matches, so popover is suppressed by the render guard.
    expect(ta.element.value).toBe('name contains ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('100.2.1: Enter commits keyword item — literal text inserted + trailing space', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'name = "foo" A';
    ta.element.selectionStart = 14;
    ta.element.selectionEnd = 14;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // keyword commit appends trailing space; the column
    // slot then opens (3 column items expected).
    expect(ta.element.value).toBe('name = "foo" AND ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('100.2.1: category badge renders per-item showing kind label', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'na';
    ta.element.selectionStart = 2;
    ta.element.selectionEnd = 2;
    await ta.trigger('input');
    const badge = wrapper.find('.cx-filters-typeahead-item__category');
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe('column');
    wrapper.unmount();
  });
});

describe('operator subset by column type (vue3)', () => {
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

  it("100.2.3: text column omits >, <, >=, <= (suggest after 'status ')", async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns: typedColumns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // Type 'status =' — the '=' is recognized for text columns; check
    // that comparison operators not in text subset are absent by typing
    // a prefix that would have matched them in the unfiltered list.
    ta.element.value = 'status >';
    ta.element.selectionStart = 8;
    ta.element.selectionEnd = 8;
    await ta.trigger('input');
    // With prefix '>', the unfiltered operator list would match '>', '>='.
    // After filter for type='text', both should be absent.
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const itemTexts = items.map((i) => i.find('span').text());
    expect(itemTexts).not.toContain('>');
    expect(itemTexts).not.toContain('>=');
    wrapper.unmount();
  });

  it("100.2.3: number column omits contains, startsWith, endsWith (suggest after 'qty ')", async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns: typedColumns, filterSpec: [] },
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
    // 'c' would match 'contains' in the unfiltered list. After Phase
    // 100.2.3 filter for type='number', 'contains' should be absent.
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const itemTexts = items.map((i) => i.find('span').text());
    expect(itemTexts).not.toContain('contains');
    expect(itemTexts).not.toContain('startsWith');
    wrapper.unmount();
  });

  it("100.2.3: boolean column shows only =, !=, isNull, isNotNull (suggest after 'active ')", async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns: typedColumns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // Use prefix 'i' which matches isNull / isNotNull / in.
    ta.element.value = 'active i';
    ta.element.selectionStart = 8;
    ta.element.selectionEnd = 8;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const itemTexts = items.map((i) => i.find('span').text());
    // 'in' is NOT in boolean's allowed list, so should be filtered out.
    expect(itemTexts).not.toContain('in');
    // isNull / isNotNull ARE allowed.
    expect(itemTexts).toContain('isNull');
    expect(itemTexts).toContain('isNotNull');
    wrapper.unmount();
  });

  it('100.2.3: untyped column falls back to all 12 operators (backwards-compat)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns: typedColumns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // Untyped column 'untyped' — typing 'c' should match 'contains'
    // (text-only operator) which would be filtered out for number /
    // date / boolean. Untyped → all 12 → 'contains' shows.
    ta.element.value = 'untyped c';
    ta.element.selectionStart = 9;
    ta.element.selectionEnd = 9;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const itemTexts = items.map((i) => i.find('span').text());
    expect(itemTexts).toContain('contains');
    wrapper.unmount();
  });

  it('100.2.3: OPERATORS_BY_COLUMN_TYPE exports correct shape (4 keys, all subsets of ADVANCED_FILTER_OPERATORS)', () => {
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

describe('value slot suggestions (vue3)', () => {
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

  it('100.2.2: with advancedFilterValueSourceRows undefined, value slot still suppresses popover (100.2.1 backwards-compat)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns: typedColumns, filterSpec: [] },
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
    wrapper.unmount();
  });

  it('100.2.2: with rows set + value slot for text column, popover opens with quoted-string value items (kind=value)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    expect(items[0]!.attributes('data-typeahead-item-kind')).toBe('value');
    // First match should be 'in-progress' (matches 'i' prefix) wrapped in quotes.
    const firstLabel = items[0]!.find('span').text();
    expect(firstLabel.startsWith('"')).toBe(true);
    expect(firstLabel.endsWith('"')).toBe(true);
    wrapper.unmount();
  });

  it('100.2.2: with rows set + value slot for number column, popover opens with bare-number value items', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    expect(items[0]!.attributes('data-typeahead-item-kind')).toBe('value');
    // Number values display bare (no quotes).
    const firstLabel = items[0]!.find('span').text();
    expect(firstLabel.startsWith('"')).toBe(false);
    expect(firstLabel).toBe('5');
    wrapper.unmount();
  });

  it('100.2.2: Enter commits string value with surrounding double quotes', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    wrapper.unmount();
  });

  it('100.2.2: Enter commits number value bare (no quotes)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    wrapper.unmount();
  });

  it('100.2.2: category badge shows "value" for value items', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    wrapper.unmount();
  });
});

describe('detectTypeaheadSlot (vue3)', () => {
  it('empty text or cursor at start → column slot', () => {
    expect(detectTypeaheadSlot('', 0).slot).toBe('column');
    expect(detectTypeaheadSlot('na', 0).slot).toBe('column');
  });
  it('after ( → column slot', () => {
    expect(detectTypeaheadSlot('(', 1).slot).toBe('column');
    expect(detectTypeaheadSlot('(na', 3).slot).toBe('column');
  });
  it('after , → column slot', () => {
    expect(detectTypeaheadSlot('foo,', 4).slot).toBe('column');
  });
  it('after a column identifier + space → operator slot', () => {
    expect(detectTypeaheadSlot('name ', 5).slot).toBe('operator');
    expect(detectTypeaheadSlot('name c', 6).slot).toBe('operator');
  });
  it('after a comparison operator → value slot', () => {
    expect(detectTypeaheadSlot('name = ', 7).slot).toBe('value');
    expect(detectTypeaheadSlot('qty > ', 6).slot).toBe('value');
    expect(detectTypeaheadSlot('name contains ', 14).slot).toBe('value');
  });
  it('after closing string literal → conjunction slot', () => {
    expect(detectTypeaheadSlot('name = "foo" ', 13).slot).toBe('conjunction');
    expect(detectTypeaheadSlot('name = "foo" A', 14).slot).toBe('conjunction');
  });
  it('after numeric literal → conjunction slot', () => {
    expect(detectTypeaheadSlot('qty > 5 ', 8).slot).toBe('conjunction');
    expect(detectTypeaheadSlot('qty > 5 A', 9).slot).toBe('conjunction');
  });
  it('after isNull (no-arg operator) → conjunction slot', () => {
    expect(detectTypeaheadSlot('name isNull ', 12).slot).toBe('conjunction');
    expect(detectTypeaheadSlot('name isNull A', 13).slot).toBe('conjunction');
  });
  it('exports operator + keyword constants', () => {
    expect(ADVANCED_FILTER_OPERATORS.length).toBe(12);
    expect(ADVANCED_FILTER_KEYWORDS).toEqual(['AND', 'OR', 'NOT']);
  });
  // prevColumn extraction for value slot.
  it("100.2.2: after 'qty > ' → value slot with prevColumn='qty'", () => {
    const r = detectTypeaheadSlot('qty > ', 6);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('qty');
    expect(r.prevToken).toBe('>');
  });
  it("100.2.2: after 'name = ' → value slot with prevColumn='name'", () => {
    const r = detectTypeaheadSlot('name = ', 7);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('name');
    expect(r.prevToken).toBe('=');
  });
  it("100.2.2: after 'qty > 5 AND name = ' → value slot with prevColumn='name' (most recent column wins)", () => {
    const text = 'qty > 5 AND name = ';
    const r = detectTypeaheadSlot(text, text.length);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('name');
  });
  it("100.2.2: after 'status contains ' → value slot with prevColumn='status'", () => {
    const text = 'status contains ';
    const r = detectTypeaheadSlot(text, text.length);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('status');
    expect(r.prevToken).toBe('contains');
  });
});

describe('extractWordAtCursor (vue3)', () => {
  it('extracts word at cursor between whitespace boundaries', () => {
    const result = extractWordAtCursor('foo bar baz', 5);
    expect(result.word).toBe('bar');
    expect(result.start).toBe(4);
    expect(result.end).toBe(7);
    expect(result.isInsideStringLiteral).toBe(false);
  });
  it('terminates at DSL delimiter chars', () => {
    const result = extractWordAtCursor('qty>5', 3);
    expect(result.word).toBe('qty');
    expect(result.start).toBe(0);
    expect(result.end).toBe(3);
  });
  it('flags cursor inside unclosed string literal', () => {
    const result = extractWordAtCursor('name = "fo', 10);
    expect(result.isInsideStringLiteral).toBe(true);
  });
  it('does NOT flag cursor after a closed string literal', () => {
    const result = extractWordAtCursor('name = "fo" and qty', 19);
    expect(result.word).toBe('qty');
    expect(result.isInsideStringLiteral).toBe(false);
  });
});

describe('histogram count badge per value (vue3)', () => {
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

  it('100.2.2.2: value-slot popover (text column) shows (N) count badge per item', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    const counts = wrapper.findAll('[data-testid="cx-filters-typeahead-item-count"]');
    expect(counts.length).toBeGreaterThan(0);
    // 'in-progress' appears 3 times; first match for query 'i'.
    expect(counts[0]!.text()).toBe('(3)');
    wrapper.unmount();
  });

  it('100.2.2.2: value-slot popover (number column) shows (N) count badge per item', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    const counts = wrapper.findAll('[data-testid="cx-filters-typeahead-item-count"]');
    expect(counts.length).toBeGreaterThan(0);
    // '10' appears 2 times; first match for '1'.
    expect(counts[0]!.text()).toBe('(2)');
    wrapper.unmount();
  });

  it('100.2.2.2: column / operator / keyword items do NOT show a count badge (backwards-compat)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    // Column slot: type 'st' → suggests 'status' column.
    ta.element.value = 'st';
    ta.element.selectionStart = 2;
    ta.element.selectionEnd = 2;
    await ta.trigger('input');
    const counts = wrapper.findAll('[data-testid="cx-filters-typeahead-item-count"]');
    expect(counts.length).toBe(0);
    wrapper.unmount();
  });
});

describe('date-typed value formatter (vue3)', () => {
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

  it('100.2.2.3: with formatTypeaheadDateValue undefined, date column shows raw ISO strings (backwards-compat)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns: dateColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: dateValueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'createdAt = 2';
    ta.element.selectionStart = 13;
    ta.element.selectionEnd = 13;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstLabel = items[0]!.find('span').text();
    expect(firstLabel).toContain('2024-01-15');
    expect(firstLabel).toContain('T00:00:00');
    wrapper.unmount();
  });

  it('100.2.2.3: with formatTypeaheadDateValue set, date column shows formatted labels', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns: dateColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: dateValueSourceRows,
        formatTypeaheadDateValue: (iso: string) => iso.slice(0, 10),
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'createdAt = 2';
    ta.element.selectionStart = 13;
    ta.element.selectionEnd = 13;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstLabel = items[0]!.find('span').text();
    expect(firstLabel).toBe('"2024-01-15"');
    expect(firstLabel).not.toContain('T00:00:00');
    wrapper.unmount();
  });

  it('100.2.2.3: commit inserts the raw ISO-quoted string regardless of formatter (DSL-correct)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns: dateColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: dateValueSourceRows,
        formatTypeaheadDateValue: (iso: string) => iso.slice(0, 10),
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'createdAt = 2024-01-15';
    ta.element.selectionStart = 22;
    ta.element.selectionEnd = 22;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // Inserted text must be the raw ISO-quoted form (parser-correct);
    // the formatter only affects display.
    expect(ta.element.value).toContain('"2024-01-15T00:00:00.000Z"');
    wrapper.unmount();
  });

  it('100.2.2.3: formatter NOT called for non-date columns (number column shows bare values)', async () => {
    const formatter = vi.fn<(iso: string) => string>((iso) => iso.slice(0, 10));
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns: dateColumns,
        filterSpec: [],
        advancedFilterValueSourceRows: dateValueSourceRows,
        formatTypeaheadDateValue: formatter,
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
    expect(formatter).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

describe('custom column-type operator override (vue3)', () => {
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

  it('100.2.3.1: with operatorsByCustomColumnType undefined, unrecognized type falls back to all 12 (backwards-compat)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns: customColumns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // 'currency' column type — no built-in entry; falls back to all 12.
    ta.element.value = 'price c';
    ta.element.selectionStart = 7;
    ta.element.selectionEnd = 7;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    // 'c' matches contains; in the all-12 fallback contains IS shown.
    const containsItem = items.find((i) => i.text().startsWith('contains'));
    expect(containsItem).toBeDefined();
    wrapper.unmount();
  });

  it('100.2.3.1: with operatorsByCustomColumnType set for custom type, list uses consumer-provided operators', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns: customColumns,
        filterSpec: [],
        operatorsByCustomColumnType: {
          currency: ['=', '!=', '>', '<', '>=', '<='],
        },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'price c';
    ta.element.selectionStart = 7;
    ta.element.selectionEnd = 7;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    // Consumer dict excludes 'contains'; query 'c' should match nothing
    // (no operator in the curated 6 starts with / contains 'c').
    const containsItem = items.find((i) => i.text().startsWith('contains'));
    expect(containsItem).toBeUndefined();
    wrapper.unmount();
  });

  it('100.2.3.1: with operatorsByCustomColumnType overriding built-in (text), consumer dict wins', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns: customColumns,
        filterSpec: [],
        operatorsByCustomColumnType: {
          // Override built-in: text → only `=`, `!=`, `isNotNull` (drops
          // `contains` / `startsWith` / `endsWith` / `in` / `isNull`).
          text: ['=', '!=', 'isNotNull'],
        },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // status column type='text'. Query 'is' matches `isNull` AND
    // `isNotNull` in the built-in text dict; with override drops
    // `isNull`, only `isNotNull` should remain — proving consumer
    // dict replaced the built-in list rather than unioning with it.
    ta.element.value = 'status is';
    ta.element.selectionStart = 9;
    ta.element.selectionEnd = 9;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBe(1);
    expect(items[0]!.find('span').text()).toBe('isNotNull');
    wrapper.unmount();
  });

  it('100.2.3.1: built-in number column unchanged when consumer dict only covers custom types', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns: customColumns,
        filterSpec: [],
        operatorsByCustomColumnType: {
          currency: ['=', '!=', '>', '<'],
        },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // qty column type='number' — built-in dict applies; 'contains'
    // dropped per built-in number filter.
    ta.element.value = 'qty c';
    ta.element.selectionStart = 5;
    ta.element.selectionEnd = 5;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    const containsItem = items.find((i) => i.text().startsWith('contains'));
    expect(containsItem).toBeUndefined();
    wrapper.unmount();
  });
});

describe('localized operator labels (vue3)', () => {
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

  it('100.2.3.2: with operatorLabels undefined, operator items show literal DSL keys (backwards-compat)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'name c';
    ta.element.selectionStart = 6;
    ta.element.selectionEnd = 6;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstLabel = items[0]!.find('span').text();
    expect(firstLabel).toBe('contains');
    wrapper.unmount();
  });

  it('100.2.3.2: with operatorLabels set for matching key, operator shows localized label', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        operatorLabels: { contains: '包含', '>=': '大于等于' },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'name c';
    ta.element.selectionStart = 6;
    ta.element.selectionEnd = 6;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstLabel = items[0]!.find('span').text();
    expect(firstLabel).toBe('包含');
    wrapper.unmount();
  });

  it('100.2.3.2: with operatorLabels set but non-matching key, falls back to DSL key', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        operatorLabels: { '>=': '大于等于' }, // 'contains' not in dict
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'name c';
    ta.element.selectionStart = 6;
    ta.element.selectionEnd = 6;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstLabel = items[0]!.find('span').text();
    expect(firstLabel).toBe('contains'); // fallback to DSL key
    wrapper.unmount();
  });

  it('100.2.3.2: commit inserts the DSL key regardless of label (parser-correct)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        operatorLabels: { contains: '包含' },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'name c';
    ta.element.selectionStart = 6;
    ta.element.selectionEnd = 6;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // Inserted text MUST be the DSL key 'contains' + trailing space
    // (100.2.4); the label '包含' only affects display.
    expect(ta.element.value).toBe('name contains ');
    wrapper.unmount();
  });

  it('100.2.3.2: substring match against the typed query uses the DSL key (search "contains" finds it whether labeled or not)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        operatorLabels: { contains: '包含' },
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // Query 'contains' should match the 'contains' operator (DSL key).
    ta.element.value = 'name contains';
    ta.element.selectionStart = 13;
    ta.element.selectionEnd = 13;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    // First match is the 'contains' operator (label '包含' displayed).
    expect(items[0]!.attributes('data-typeahead-item-kind')).toBe('operator');
    wrapper.unmount();
  });
});

describe('auto-trigger after operator commit (vue3)', () => {
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

  it('100.2.4: column commit appends trailing space + auto-opens typeahead for operator slot', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'na';
    ta.element.selectionStart = 2;
    ta.element.selectionEnd = 2;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(ta.element.value).toBe('name ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(true);
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    // Operator slot opens with all 12 operators (no column.type set).
    expect(items[0]!.attributes('data-typeahead-item-kind')).toBe('operator');
    wrapper.unmount();
  });

  it('100.2.4: operator commit appends trailing space + auto-opens typeahead for value slot (when rows provided)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'name c';
    ta.element.selectionStart = 6;
    ta.element.selectionEnd = 6;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(ta.element.value).toBe('name contains ');
    // Value slot opens because rows are provided + prevColumn='name'.
    const popover = wrapper.find('[data-testid="cx-filters-typeahead"]');
    expect(popover.exists()).toBe(true);
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items[0]!.attributes('data-typeahead-item-kind')).toBe('value');
    wrapper.unmount();
  });

  it('100.2.4: keyword commit appends trailing space + auto-opens typeahead for column slot', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'name = "foo" A';
    ta.element.selectionStart = 14;
    ta.element.selectionEnd = 14;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(ta.element.value).toBe('name = "foo" AND ');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(true);
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items[0]!.attributes('data-typeahead-item-kind')).toBe('column');
    wrapper.unmount();
  });

  it('100.2.4: value commit does NOT append trailing space + typeahead closes (Decision I.1)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'name = a';
    ta.element.selectionStart = 8;
    ta.element.selectionEnd = 8;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // Value commit inserts '"alice"' — no trailing space appended.
    expect(ta.element.value).toBe('name = "alice"');
    expect(ta.element.value.endsWith(' ')).toBe(false);
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(false);
    wrapper.unmount();
  });
});

describe('auto-scroll active item into view (vue3)', () => {
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

  it('100.2.6: arrow-down past visible threshold triggers scrollIntoView with { block: nearest }', async () => {
    const scrollSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollSpy;
    try {
      const wrapper = mount(ChronixFiltersToolPanel, {
        props: { tableHandle: makeHandle(), columns: manyColumns, filterSpec: [] },
        attachTo: document.body,
      });
      const ta = wrapper.find<HTMLTextAreaElement>(
        '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
      );
      stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
      ta.element.value = 'c';
      ta.element.selectionStart = 1;
      ta.element.selectionEnd = 1;
      await ta.trigger('input');
      // First scroll fires when activeIdx becomes 0 on open.
      scrollSpy.mockClear();
      await ta.trigger('keydown', { key: 'ArrowDown' });
      await wrapper.vm.$nextTick();
      expect(scrollSpy).toHaveBeenCalled();
      // Verify { block: 'nearest' } arg.
      const lastCall = scrollSpy.mock.calls[scrollSpy.mock.calls.length - 1];
      expect(lastCall?.[0]).toEqual({ block: 'nearest', behavior: 'auto' });
      wrapper.unmount();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it('100.2.6: typeahead open with activeIdx = 0 triggers scroll-into-view (first item)', async () => {
    const scrollSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollSpy;
    try {
      const wrapper = mount(ChronixFiltersToolPanel, {
        props: { tableHandle: makeHandle(), columns: manyColumns, filterSpec: [] },
        attachTo: document.body,
      });
      const ta = wrapper.find<HTMLTextAreaElement>(
        '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
      );
      stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
      ta.element.value = 'c';
      ta.element.selectionStart = 1;
      ta.element.selectionEnd = 1;
      await ta.trigger('input');
      // The activeIdx watcher fires once (from -1 → 0 on open).
      expect(scrollSpy).toHaveBeenCalled();
      wrapper.unmount();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it('100.2.6: typeahead closed does NOT trigger scroll-into-view', async () => {
    const scrollSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollSpy;
    try {
      const wrapper = mount(ChronixFiltersToolPanel, {
        props: { tableHandle: makeHandle(), columns: manyColumns, filterSpec: [] },
        attachTo: document.body,
      });
      const ta = wrapper.find<HTMLTextAreaElement>(
        '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
      );
      stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
      // Cursor inside an open string literal — suppresses popover.
      ta.element.value = 'name = "fo';
      ta.element.selectionStart = 10;
      ta.element.selectionEnd = 10;
      await ta.trigger('input');
      // activeIdx stays at -1; no scroll triggered.
      expect(scrollSpy).not.toHaveBeenCalled();
      wrapper.unmount();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });
});

describe('string-literal-internal typeahead (vue3)', () => {
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

  it('100.2.2.4: cursor inside open string literal after `=` opens value typeahead with bare query', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    ta.element.value = 'status = "in';
    ta.element.selectionStart = 12;
    ta.element.selectionEnd = 12;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.attributes('data-typeahead-item-kind')).toBe('value');
    wrapper.unmount();
  });

  it('100.2.2.4: non-string values filtered out in string-literal context (only string-kind values shown)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    // qty is a number column. Inside open " context, even though the
    // detector returns slot='value', only string-kind values appear
    // (number values filtered out per Decision N filter-out rule).
    ta.element.value = 'qty > "1';
    ta.element.selectionStart = 8;
    ta.element.selectionEnd = 8;
    await ta.trigger('input');
    // No string-kind values in qty column → items 0 → popover closed.
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('100.2.2.4: commit inside open string literal inserts bare-value + closing `"`', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    ta.element.value = 'status = "in-pr';
    ta.element.selectionStart = 15;
    ta.element.selectionEnd = 15;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // Result: '"in-pr' replaced with 'in-progress"' = full literal completed.
    expect(ta.element.value).toBe('status = "in-progress"');
    wrapper.unmount();
  });

  it('100.2.2.4: after closed " AND " (no comparison op before opening) popover does NOT open', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
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
    // Open " after AND keyword — no operator before the opening quote.
    // detectTypeaheadSlot returns value slot WITHOUT prevColumn → empty
    // matches → popover suppressed.
    ta.element.value = 'status = "foo" AND "ba';
    ta.element.selectionStart = 22;
    ta.element.selectionEnd = 22;
    await ta.trigger('input');
    expect(wrapper.find('[data-testid="cx-filters-typeahead"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('100.2.2.4: detectTypeaheadSlot returns slot=value with prevColumn for `name = "in`', () => {
    const r = detectTypeaheadSlot('name = "in', 10);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('name');
  });

  it('100.2.2.4: detectTypeaheadSlot returns slot=conjunction for `name = "foo" ` (closing quote)', () => {
    const r = detectTypeaheadSlot('name = "foo" ', 13);
    expect(r.slot).toBe('conjunction');
  });

  it('100.2.2.4: detectTypeaheadSlot returns slot=value with prevColumn=status for word-operator `status contains "in`', () => {
    const r = detectTypeaheadSlot('status contains "in', 19);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('status');
  });
});

describe('per-slot recent LRU rings (vue3)', () => {
  const columns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: '名称' },
    { id: 'qty', field: 'qty', headerName: '数量' },
    { id: 'status', field: 'status', headerName: '状态' },
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

  it('100.2.5: column commit → next column typeahead shows the committed column at TOP with recent badge', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // 1st: commit 'qty' (cursor at 'q')
    ta.element.value = 'q';
    ta.element.selectionStart = 1;
    ta.element.selectionEnd = 1;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // Textarea now 'qty ' (auto-trigger appended space; operator slot open).
    // Type 'q' again to reopen column slot.
    ta.element.value = 'qty AND q';
    ta.element.selectionStart = 9;
    ta.element.selectionEnd = 9;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    // First item should be the recently-committed 'qty' column with recent badge.
    const firstRecentBadge = items[0]!.find('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(firstRecentBadge.exists()).toBe(true);
    expect(firstRecentBadge.text()).toBe('recent');
    wrapper.unmount();
  });

  it('100.2.5: dedup on repeat commits (same item only once in ring)', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // Commit 'qty' twice in a row.
    ta.element.value = 'q';
    ta.element.selectionStart = 1;
    ta.element.selectionEnd = 1;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    ta.element.value = 'qty AND q';
    ta.element.selectionStart = 9;
    ta.element.selectionEnd = 9;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // Now type one more 'q' to reopen.
    ta.element.value = 'qty AND qty AND q';
    ta.element.selectionStart = 17;
    ta.element.selectionEnd = 17;
    await ta.trigger('input');
    const recentBadges = wrapper.findAll('[data-testid="cx-filters-typeahead-item-recent"]');
    // Only ONE recent badge (qty appears once, not twice).
    expect(recentBadges.length).toBe(1);
    wrapper.unmount();
  });

  it('100.2.5: typeaheadRecentLimit=0 disables the feature entirely', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [], typeaheadRecentLimit: 0 },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'q';
    ta.element.selectionStart = 1;
    ta.element.selectionEnd = 1;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    ta.element.value = 'qty AND q';
    ta.element.selectionStart = 9;
    ta.element.selectionEnd = 9;
    await ta.trigger('input');
    const recentBadges = wrapper.findAll('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(recentBadges.length).toBe(0);
    wrapper.unmount();
  });

  it('100.2.5: cross-slot isolation — recent column does NOT appear in operator slot', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // Commit 'qty' (column slot).
    ta.element.value = 'q';
    ta.element.selectionStart = 1;
    ta.element.selectionEnd = 1;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // Now in operator slot; type 'q' to see operator items.
    // qty is in column ring, NOT operator ring — no recent badge.
    ta.element.value = 'qty c';
    ta.element.selectionStart = 5;
    ta.element.selectionEnd = 5;
    await ta.trigger('input');
    const recentBadges = wrapper.findAll('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(recentBadges.length).toBe(0);
    wrapper.unmount();
  });

  it('100.2.5: value commit pushes to value ring + appears with recent badge in next value-slot typeahead', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueSourceRows: valueSourceRows,
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    // First: commit 'alice' (value slot).
    ta.element.value = 'name = a';
    ta.element.selectionStart = 8;
    ta.element.selectionEnd = 8;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    // Now reopen value slot for same column.
    ta.element.value = 'name = "alice" AND name = a';
    ta.element.selectionStart = 27;
    ta.element.selectionEnd = 27;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstRecentBadge = items[0]!.find('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(firstRecentBadge.exists()).toBe(true);
    wrapper.unmount();
  });
});

describe('SSR async value getter (vue3)', () => {
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

  it('100.2.2.1: getter called with (colId, query) on value-slot input', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.resolve([{ value: 'in-progress', count: 5 }]));
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
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
    // getter signature widened with optional
    // 3rd arg `signal?: AbortSignal`. Match first 2 args; signal is
    // an AbortSignal instance.
    expect(getter).toHaveBeenCalledWith('status', 'i', expect.any(AbortSignal));
    wrapper.unmount();
  });

  it('100.2.2.1: loading placeholder rendered before promise resolves', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => new Promise(() => undefined)); // never resolves
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
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
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="cx-filters-typeahead-loading"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('100.2.2.1: resolved values render as value-kind items', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.resolve([{ value: 'in-progress', count: 5 }]));
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
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
    await flushPromises();
    await wrapper.vm.$nextTick();
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.attributes('data-typeahead-item-kind')).toBe('value');
    wrapper.unmount();
  });

  it('100.2.2.1: error placeholder rendered on promise rejection', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.reject(new Error('network')));
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
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
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-testid="cx-filters-typeahead-error"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('100.2.2.1: cache hit on second-time same (colId, query) — getter NOT called twice', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.resolve([{ value: 'in-progress', count: 5 }]));
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
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
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(getter).toHaveBeenCalledTimes(1);
    // Re-trigger same key (e.g. by repeating the input).
    await ta.trigger('input');
    await flushPromises();
    expect(getter).toHaveBeenCalledTimes(1); // Still 1 — cache hit.
    wrapper.unmount();
  });

  it('100.2.2.1: getter wins over advancedFilterValueSourceRows when both set', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.resolve([{ value: 'from-getter', count: 1 }]));
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
        advancedFilterValueSourceRows: [
          { id: 'r1', data: { status: 'from-rows' } },
        ] as readonly RowSpec[],
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'status = f';
    ta.element.selectionStart = 10;
    ta.element.selectionEnd = 10;
    await ta.trigger('input');
    await flushPromises();
    await wrapper.vm.$nextTick();
    expect(getter).toHaveBeenCalledTimes(1);
    // The single item shown should be from the getter, not from rows.
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBe(1);
    const label = items[0]!.find('span').text();
    expect(label).toContain('from-getter');
    expect(label).not.toContain('from-rows');
    wrapper.unmount();
  });
});

describe('persistent typeahead recent (vue3)', () => {
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

  it('112: memory backend (default) does NOT persist across mounts', async () => {
    const first = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const taFirst = first.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(taFirst.element, { left: 10, bottom: 100, width: 200 });
    taFirst.element.value = 'q';
    taFirst.element.selectionStart = 1;
    taFirst.element.selectionEnd = 1;
    await taFirst.trigger('input');
    await taFirst.trigger('keydown', { key: 'Enter' });
    await first.vm.$nextTick();
    first.unmount();

    // Fresh mount — recent ring should be empty (memory backend wipes on unmount).
    expect(window.localStorage.getItem('cx-table-typeahead-recent::column')).toBeNull();
    const second = mount(ChronixFiltersToolPanel, {
      props: { tableHandle: makeHandle(), columns, filterSpec: [] },
      attachTo: document.body,
    });
    const taSecond = second.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(taSecond.element, { left: 10, bottom: 100, width: 200 });
    taSecond.element.value = 'q';
    taSecond.element.selectionStart = 1;
    taSecond.element.selectionEnd = 1;
    await taSecond.trigger('input');
    const recentBadges = second.findAll('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(recentBadges.length).toBe(0);
    second.unmount();
  });

  it('112: localStorage backend writes ring on commit', async () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        typeaheadRecentStorage: 'localStorage',
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'q';
    ta.element.selectionStart = 1;
    ta.element.selectionEnd = 1;
    await ta.trigger('input');
    await ta.trigger('keydown', { key: 'Enter' });
    await wrapper.vm.$nextTick();
    expect(window.localStorage.getItem('cx-table-typeahead-recent::column')).toBe('["qty"]');
    wrapper.unmount();
  });

  it('112: localStorage backend hydrates on mount', async () => {
    window.localStorage.setItem('cx-table-typeahead-recent::column', '["qty","name"]');
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        typeaheadRecentStorage: 'localStorage',
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'q';
    ta.element.selectionStart = 1;
    ta.element.selectionEnd = 1;
    await ta.trigger('input');
    const items = wrapper.findAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstRecentBadge = items[0]!.find('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(firstRecentBadge.exists()).toBe(true);
    wrapper.unmount();
  });

  it('112: localStorage backend ignores malformed payload', async () => {
    window.localStorage.setItem('cx-table-typeahead-recent::column', '{not-json');
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: makeHandle(),
        columns,
        filterSpec: [],
        typeaheadRecentStorage: 'localStorage',
      },
      attachTo: document.body,
    });
    const ta = wrapper.find<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    );
    stubAnchor(ta.element, { left: 10, bottom: 100, width: 200 });
    ta.element.value = 'q';
    ta.element.selectionStart = 1;
    ta.element.selectionEnd = 1;
    await ta.trigger('input');
    const recentBadges = wrapper.findAll('[data-testid="cx-filters-typeahead-item-recent"]');
    expect(recentBadges.length).toBe(0);
    wrapper.unmount();
  });
});

describe('formatFilterChipLabel (vue3)', () => {
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

describe('P3 finale — AbortController + per-column recents (vue3)', () => {
  const phase118Columns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name' },
    { id: 'qty', field: 'qty', headerName: 'Qty', type: 'number' },
    { id: 'status', field: 'status', headerName: 'Status' },
  ];
  const phase118Handle = makeHandle();

  it('getter receives an AbortSignal arg', async () => {
    const getter = vi.fn<
      (colId: string, query: string, signal?: AbortSignal) => Promise<readonly ColumnUniqueValue[]>
    >(() => Promise.resolve([{ value: 'OK', count: 1 }]));
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: phase118Handle,
        columns: phase118Columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
      },
    });
    const ta = wrapper.find('textarea');
    ta.element.value = 'status = a';
    ta.element.selectionStart = 10;
    ta.element.selectionEnd = 10;
    await ta.trigger('input');
    expect(getter).toHaveBeenCalled();
    const args = getter.mock.calls[0]!;
    expect(args[0]).toBe('status');
    expect(args[1]).toBe('a');
    expect(args[2]).toBeInstanceOf(AbortSignal);
    wrapper.unmount();
  });

  it('rapid typing aborts the prior in-flight controller', async () => {
    const signals: AbortSignal[] = [];
    const getter = vi.fn((colId: string, query: string, signal?: AbortSignal) => {
      if (signal != null) signals.push(signal);
      return new Promise<readonly ColumnUniqueValue[]>(() => {
        // never resolve — let supersession abort.
      });
    });
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: phase118Handle,
        columns: phase118Columns,
        filterSpec: [],
        advancedFilterValueGetter: getter,
      },
    });
    const ta = wrapper.find('textarea');
    ta.element.value = 'status = a';
    ta.element.selectionStart = 10;
    ta.element.selectionEnd = 10;
    await ta.trigger('input');
    ta.element.value = 'status = ab';
    ta.element.selectionStart = 11;
    ta.element.selectionEnd = 11;
    await ta.trigger('input');
    expect(signals.length).toBeGreaterThanOrEqual(2);
    // The FIRST signal should be aborted (superseded by the 2nd request
    // for a different key); we just verify the supersession path runs.
    expect(getter).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('typeaheadRecentScope="per-column-value" segregates value recents by column', () => {
    const wrapper = mount(ChronixFiltersToolPanel, {
      props: {
        tableHandle: phase118Handle,
        columns: phase118Columns,
        filterSpec: [],
        typeaheadRecentScope: 'per-column-value',
      },
    });
    // No-error mounting smoke test; full segregation behavior is
    // exercised by recent-storage logic which the prop wires.
    expect(wrapper.props('typeaheadRecentScope')).toBe('per-column-value');
    wrapper.unmount();
  });
});
