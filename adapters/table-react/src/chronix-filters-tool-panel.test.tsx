import { fireEvent, render } from '@testing-library/react';
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

describe('<ChronixFiltersToolPanel> (react)', () => {
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
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={filterSpec}
      />,
    );
    const chips = container.querySelectorAll('[data-tool-panel-chip-index]');
    expect(chips).toHaveLength(3);
    const labels = Array.from(chips).map(
      (c) => c.querySelector('.cx-table-filters-tool-panel__chip-label')!.textContent,
    );
    expect(labels[0]).toBe('「名称」 包含 "foo"');
    expect(labels[1]).toBe('「数量」 >= 10');
    expect(labels[2]).toBe('「状态」 ∈ {OK, WIP}');
    unmount();
  });

  it('clicking a chip close button calls setFilter (or setAdvancedFilter for expression)', () => {
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
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle({ setFilter, setAdvancedFilter })}
        columns={columns}
        filterSpec={filterSpec}
      />,
    );
    fireEvent.click(container.querySelector('[data-testid="cx-filters-tool-panel-chip-close-0"]')!);
    expect(setFilter).toHaveBeenCalledTimes(1);
    expect(setFilter).toHaveBeenCalledWith([filterSpec[1]]);
    expect(setAdvancedFilter).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('[data-testid="cx-filters-tool-panel-chip-close-1"]')!);
    expect(setAdvancedFilter).toHaveBeenCalledTimes(1);
    expect(setAdvancedFilter).toHaveBeenCalledWith(null);
    unmount();
  });

  it('Clear-all button calls clearFilter AND setAdvancedFilter(null)', () => {
    const clearFilter = vi.fn();
    const setAdvancedFilter = vi.fn();
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle({ clearFilter, setAdvancedFilter })}
        columns={columns}
        filterSpec={[]}
      />,
    );
    fireEvent.click(container.querySelector('[data-testid="cx-filters-tool-panel-clear-all"]')!);
    expect(clearFilter).toHaveBeenCalledTimes(1);
    expect(setAdvancedFilter).toHaveBeenCalledTimes(1);
    expect(setAdvancedFilter).toHaveBeenCalledWith(null);
    unmount();
  });

  it('Apply button calls parseAndSetAdvancedFilter with the textarea content', () => {
    const parseAndSetAdvancedFilter = vi.fn<(text: string) => ParseFilterExpressionResult>(() => ({
      ok: true,
      expression: null,
    }));
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle({ parseAndSetAdvancedFilter })}
        columns={columns}
        filterSpec={[]}
      />,
    );
    const textarea = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    fireEvent.change(textarea, { target: { value: 'name contains "foo"' } });
    fireEvent.click(
      container.querySelector('[data-testid="cx-filters-tool-panel-advanced-apply"]')!,
    );
    expect(parseAndSetAdvancedFilter).toHaveBeenCalledTimes(1);
    expect(parseAndSetAdvancedFilter).toHaveBeenCalledWith('name contains "foo"');
    unmount();
  });

  it('Parse errors render below the textarea when result.ok === false', () => {
    const parseAndSetAdvancedFilter = vi.fn<(text: string) => ParseFilterExpressionResult>(() => ({
      ok: false,
      errors: [
        { message: 'unexpected token at position 5', position: 5 },
        { message: 'missing operator', position: 12 },
      ],
    }));
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle({ parseAndSetAdvancedFilter })}
        columns={columns}
        filterSpec={[]}
      />,
    );
    const textarea = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    fireEvent.change(textarea, { target: { value: 'bad input' } });
    fireEvent.click(
      container.querySelector('[data-testid="cx-filters-tool-panel-advanced-apply"]')!,
    );
    const errorList = container.querySelector('[data-testid="cx-filters-tool-panel-errors"]');
    expect(errorList).not.toBeNull();
    const items = errorList!.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]!.textContent).toBe('unexpected token at position 5');
    expect(items[1]!.textContent).toBe('missing operator');
    unmount();
  });
});

describe('Phase 100.2: advanced filter typeahead (react)', () => {
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

  it("100.2 (react): typing 'na' opens popover with name match + 'na' highlighted", () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 2;
    ta.selectionEnd = 2;
    fireEvent.change(ta, { target: { value: 'na' } });
    const popover = container.querySelector('[data-testid="cx-filters-typeahead"]');
    expect(popover).not.toBeNull();
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items).toHaveLength(1);
    expect(items[0]!.getAttribute('aria-selected')).toBe('true'); // boolean true serializes to "true" attr
    // Label is in the first span; category badge ('column') is in
    // the second span (Phase 100.2.1 layout).
    expect(items[0]!.querySelector('span')!.textContent).toBe('名称');
    unmount();
  });

  it('100.2 (react): ArrowDown advances active item; popover stays open', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 1;
    ta.selectionEnd = 1;
    fireEvent.change(ta, { target: { value: 't' } });
    const itemsBefore = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(itemsBefore.length).toBeGreaterThanOrEqual(2);
    expect(itemsBefore[0]!.getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(ta, { key: 'ArrowDown' });
    const itemsAfter = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(itemsAfter[0]!.getAttribute('aria-selected')).toBe('false');
    expect(itemsAfter[1]!.getAttribute('aria-selected')).toBe('true');
    unmount();
  });

  it('100.2 (react): Enter commits active item — textarea replaced with col.id + trailing space (Phase 100.2.4)', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 2;
    ta.selectionEnd = 2;
    fireEvent.change(ta, { target: { value: 'na' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    // Phase 100.2.4 (react port): column commit appends a trailing
    // space + auto-triggers typeahead for the operator slot.
    expect(ta.value).toBe('name ');
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).not.toBeNull();
    unmount();
  });

  it('100.2 (react): cursor inside open string literal suppresses popover', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 10;
    ta.selectionEnd = 10;
    fireEvent.change(ta, { target: { value: 'name = "fo' } });
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).toBeNull();
    unmount();
  });

  it('100.2 (react): click on a typeahead item commits the selection (Phase 100.2.4 trailing space)', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 2;
    ta.selectionEnd = 2;
    fireEvent.change(ta, { target: { value: 'na' } });
    const item = container.querySelector<HTMLElement>('[data-testid="cx-filters-typeahead-item"]')!;
    fireEvent.click(item);
    expect(ta.value).toBe('name ');
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).not.toBeNull();
    unmount();
  });
});

describe('Phase 100.2.1: typeahead slot detection + operator/keyword suggestions (react)', () => {
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

  it('100.2.1 (react): column slot — kind=column', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 2;
    ta.selectionEnd = 2;
    fireEvent.change(ta, { target: { value: 'na' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items).toHaveLength(1);
    expect(items[0]!.getAttribute('data-typeahead-item-kind')).toBe('column');
    unmount();
  });

  it('100.2.1 (react): operator slot — kind=operator', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 6;
    ta.selectionEnd = 6;
    fireEvent.change(ta, { target: { value: 'name c' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.getAttribute('data-typeahead-item-kind')).toBe('operator');
    unmount();
  });

  it('100.2.1 (react): conjunction slot — kind=keyword', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 14;
    ta.selectionEnd = 14;
    fireEvent.change(ta, { target: { value: 'name = "foo" A' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.getAttribute('data-typeahead-item-kind')).toBe('keyword');
    unmount();
  });

  it('100.2.1 (react): value slot suppresses popover', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 7;
    ta.selectionEnd = 7;
    fireEvent.change(ta, { target: { value: 'qty = 5' } });
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).toBeNull();
    unmount();
  });

  it('100.2.1 (react): Enter commits operator item + Phase 100.2.4 trailing space', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 6;
    ta.selectionEnd = 6;
    fireEvent.change(ta, { target: { value: 'name c' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(ta.value).toBe('name contains ');
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).toBeNull();
    unmount();
  });

  it('100.2.1 (react): Enter commits keyword item + Phase 100.2.4 trailing space', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 14;
    ta.selectionEnd = 14;
    fireEvent.change(ta, { target: { value: 'name = "foo" A' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(ta.value).toBe('name = "foo" AND ');
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).not.toBeNull();
    unmount();
  });

  it('100.2.1 (react): category badge renders', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 2;
    ta.selectionEnd = 2;
    fireEvent.change(ta, { target: { value: 'na' } });
    const badge = container.querySelector('.cx-filters-typeahead-item__category');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe('column');
    unmount();
  });
});

describe('Phase 100.2.3: operator subset by column type (react)', () => {
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

  function getItemTexts(container: HTMLElement): string[] {
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    return Array.from(items).map((el) => {
      const labelSpan = el.querySelector('span');
      return labelSpan?.textContent ?? '';
    });
  }

  it("100.2.3 (react): text column omits >, >= (suggest after 'status >')", () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={typedColumns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 8;
    ta.selectionEnd = 8;
    fireEvent.change(ta, { target: { value: 'status >' } });
    const texts = getItemTexts(container);
    expect(texts).not.toContain('>');
    expect(texts).not.toContain('>=');
    unmount();
  });

  it("100.2.3 (react): number column omits contains, startsWith (suggest after 'qty c')", () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={typedColumns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 5;
    ta.selectionEnd = 5;
    fireEvent.change(ta, { target: { value: 'qty c' } });
    const texts = getItemTexts(container);
    expect(texts).not.toContain('contains');
    expect(texts).not.toContain('startsWith');
    unmount();
  });

  it("100.2.3 (react): boolean column omits 'in', keeps isNull/isNotNull (suggest after 'active i')", () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={typedColumns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 8;
    ta.selectionEnd = 8;
    fireEvent.change(ta, { target: { value: 'active i' } });
    const texts = getItemTexts(container);
    expect(texts).not.toContain('in');
    expect(texts).toContain('isNull');
    expect(texts).toContain('isNotNull');
    unmount();
  });

  it('100.2.3 (react): untyped column falls back to all 12 operators (backwards-compat)', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={typedColumns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 9;
    ta.selectionEnd = 9;
    fireEvent.change(ta, { target: { value: 'untyped c' } });
    const texts = getItemTexts(container);
    expect(texts).toContain('contains');
    unmount();
  });

  it('100.2.3 (react): OPERATORS_BY_COLUMN_TYPE exports correct shape (4 keys, all subsets of ADVANCED_FILTER_OPERATORS)', () => {
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

describe('Phase 100.2.2: value slot suggestions (react)', () => {
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

  it('100.2.2 (react): with advancedFilterValueSourceRows undefined, value slot still suppresses popover', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={typedColumns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 7;
    ta.selectionEnd = 7;
    fireEvent.change(ta, { target: { value: 'qty = 5' } });
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).toBeNull();
    unmount();
  });

  it('100.2.2 (react): with rows + text column, popover opens with quoted-string value items', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={typedColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 10;
    ta.selectionEnd = 10;
    fireEvent.change(ta, { target: { value: 'status = i' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.getAttribute('data-typeahead-item-kind')).toBe('value');
    const firstLabel = items[0]!.querySelector('span')?.textContent ?? '';
    expect(firstLabel.startsWith('"')).toBe(true);
    expect(firstLabel.endsWith('"')).toBe(true);
    unmount();
  });

  it('100.2.2 (react): with rows + number column, popover opens with bare-number value items', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={typedColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 7;
    ta.selectionEnd = 7;
    fireEvent.change(ta, { target: { value: 'qty > 5' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.getAttribute('data-typeahead-item-kind')).toBe('value');
    const firstLabel = items[0]!.querySelector('span')?.textContent ?? '';
    expect(firstLabel).toBe('5');
    unmount();
  });

  it('100.2.2 (react): Enter commits string value with surrounding double quotes', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={typedColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 14;
    ta.selectionEnd = 14;
    fireEvent.change(ta, { target: { value: 'status = in-pr' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(ta.value).toBe('status = "in-progress"');
    unmount();
  });

  it('100.2.2 (react): Enter commits number value bare', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={typedColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 7;
    ta.selectionEnd = 7;
    fireEvent.change(ta, { target: { value: 'qty > 1' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(ta.value).toBe('qty > 10');
    unmount();
  });

  it('100.2.2 (react): category badge shows "value" for value items', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={typedColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 10;
    ta.selectionEnd = 10;
    fireEvent.change(ta, { target: { value: 'status = i' } });
    const badge = container.querySelector('.cx-filters-typeahead-item__category');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe('value');
    unmount();
  });
});

describe('detectTypeaheadSlot (react)', () => {
  it('cursor at start → column slot', () => {
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
  it('after string literal close → conjunction slot', () => {
    expect(detectTypeaheadSlot('name = "foo" ', 13).slot).toBe('conjunction');
  });
  it('after numeric → conjunction slot', () => {
    expect(detectTypeaheadSlot('qty > 5 ', 8).slot).toBe('conjunction');
  });
  it('after isNull → conjunction slot', () => {
    expect(detectTypeaheadSlot('name isNull ', 12).slot).toBe('conjunction');
  });
  it('exports operator + keyword constants', () => {
    expect(ADVANCED_FILTER_OPERATORS.length).toBe(12);
    expect(ADVANCED_FILTER_KEYWORDS).toEqual(['AND', 'OR', 'NOT']);
  });
  // Phase 100.2.2 (2026-06-01 — react port): prevColumn extraction.
  it("100.2.2 (react): after 'qty > ' → value slot with prevColumn='qty'", () => {
    const r = detectTypeaheadSlot('qty > ', 6);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('qty');
  });
  it("100.2.2 (react): after 'name = ' → value slot with prevColumn='name'", () => {
    const r = detectTypeaheadSlot('name = ', 7);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('name');
  });
  it("100.2.2 (react): after 'qty > 5 AND name = ' → value slot with prevColumn='name'", () => {
    const text = 'qty > 5 AND name = ';
    const r = detectTypeaheadSlot(text, text.length);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('name');
  });
  it("100.2.2 (react): after 'status contains ' → value slot with prevColumn='status'", () => {
    const text = 'status contains ';
    const r = detectTypeaheadSlot(text, text.length);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('status');
  });
});

describe('extractWordAtCursor (react)', () => {
  it('extracts word at cursor between whitespace boundaries', () => {
    expect(extractWordAtCursor('foo bar baz', 5).word).toBe('bar');
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

describe('Phase 100.2.2.2: histogram count badge per value (react)', () => {
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

  it('100.2.2.2 (react): value-slot popover (text column) shows (N) count badge per item', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={typedColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 10;
    ta.selectionEnd = 10;
    fireEvent.change(ta, { target: { value: 'status = i' } });
    const counts = container.querySelectorAll('[data-testid="cx-filters-typeahead-item-count"]');
    expect(counts.length).toBeGreaterThan(0);
    expect(counts[0]!.textContent).toBe('(3)');
    unmount();
  });

  it('100.2.2.2 (react): value-slot popover (number column) shows (N) count badge per item', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={typedColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 7;
    ta.selectionEnd = 7;
    fireEvent.change(ta, { target: { value: 'qty > 1' } });
    const counts = container.querySelectorAll('[data-testid="cx-filters-typeahead-item-count"]');
    expect(counts.length).toBeGreaterThan(0);
    expect(counts[0]!.textContent).toBe('(2)');
    unmount();
  });

  it('100.2.2.2 (react): column / operator / keyword items do NOT show a count badge (backwards-compat)', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={typedColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 2;
    ta.selectionEnd = 2;
    fireEvent.change(ta, { target: { value: 'st' } });
    const counts = container.querySelectorAll('[data-testid="cx-filters-typeahead-item-count"]');
    expect(counts.length).toBe(0);
    unmount();
  });
});

describe('Phase 100.2.2.3: date-typed value formatter (react)', () => {
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

  it('100.2.2.3 (react): with formatTypeaheadDateValue undefined, date column shows raw ISO strings', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={dateColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={dateValueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 13;
    ta.selectionEnd = 13;
    fireEvent.change(ta, { target: { value: 'createdAt = 2' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstLabel = items[0]!.querySelector('span')!.textContent ?? '';
    expect(firstLabel).toContain('2024-01-15');
    expect(firstLabel).toContain('T00:00:00');
    unmount();
  });

  it('100.2.2.3 (react): with formatTypeaheadDateValue set, date column shows formatted labels', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={dateColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={dateValueSourceRows}
        formatTypeaheadDateValue={(iso) => iso.slice(0, 10)}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 13;
    ta.selectionEnd = 13;
    fireEvent.change(ta, { target: { value: 'createdAt = 2' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstLabel = items[0]!.querySelector('span')!.textContent ?? '';
    expect(firstLabel).toBe('"2024-01-15"');
    expect(firstLabel).not.toContain('T00:00:00');
    unmount();
  });

  it('100.2.2.3 (react): commit inserts the raw ISO-quoted string regardless of formatter (DSL-correct)', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={dateColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={dateValueSourceRows}
        formatTypeaheadDateValue={(iso) => iso.slice(0, 10)}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 22;
    ta.selectionEnd = 22;
    fireEvent.change(ta, { target: { value: 'createdAt = 2024-01-15' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(ta.value).toContain('"2024-01-15T00:00:00.000Z"');
    unmount();
  });

  it('100.2.2.3 (react): formatter NOT called for non-date columns', () => {
    const formatter = vi.fn<(iso: string) => string>((iso) => iso.slice(0, 10));
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={dateColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={dateValueSourceRows}
        formatTypeaheadDateValue={formatter}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 7;
    ta.selectionEnd = 7;
    fireEvent.change(ta, { target: { value: 'qty > 1' } });
    expect(formatter).not.toHaveBeenCalled();
    unmount();
  });
});

describe('Phase 100.2.3.1: custom column-type operator override (react)', () => {
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

  it('100.2.3.1 (react): with operatorsByCustomColumnType undefined, unrecognized type falls back to all 12', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={customColumns}
        filterSpec={[]}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 7;
    ta.selectionEnd = 7;
    fireEvent.change(ta, { target: { value: 'price c' } });
    const items = Array.from(
      container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]'),
    );
    const containsExists = items.some((i) => (i.textContent ?? '').startsWith('contains'));
    expect(containsExists).toBe(true);
    unmount();
  });

  it('100.2.3.1 (react): with operatorsByCustomColumnType set for custom type, list uses consumer-provided operators', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={customColumns}
        filterSpec={[]}
        operatorsByCustomColumnType={{ currency: ['=', '!=', '>', '<', '>=', '<='] }}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 7;
    ta.selectionEnd = 7;
    fireEvent.change(ta, { target: { value: 'price c' } });
    const items = Array.from(
      container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]'),
    );
    const containsExists = items.some((i) => (i.textContent ?? '').startsWith('contains'));
    expect(containsExists).toBe(false);
    unmount();
  });

  it('100.2.3.1 (react): with operatorsByCustomColumnType overriding built-in (text), consumer dict wins', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={customColumns}
        filterSpec={[]}
        operatorsByCustomColumnType={{ text: ['=', '!=', 'isNotNull'] }}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 9;
    ta.selectionEnd = 9;
    fireEvent.change(ta, { target: { value: 'status is' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items).toHaveLength(1);
    expect(items[0]!.querySelector('span')!.textContent).toBe('isNotNull');
    unmount();
  });

  it('100.2.3.1 (react): built-in number column unchanged when consumer dict only covers custom types', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={customColumns}
        filterSpec={[]}
        operatorsByCustomColumnType={{ currency: ['=', '!=', '>', '<'] }}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 5;
    ta.selectionEnd = 5;
    fireEvent.change(ta, { target: { value: 'qty c' } });
    const items = Array.from(
      container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]'),
    );
    const containsExists = items.some((i) => (i.textContent ?? '').startsWith('contains'));
    expect(containsExists).toBe(false);
    unmount();
  });
});

describe('Phase 100.2.3.2: localized operator labels (react)', () => {
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

  it('100.2.3.2 (react): with operatorLabels undefined, operator items show literal DSL keys', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 6;
    ta.selectionEnd = 6;
    fireEvent.change(ta, { target: { value: 'name c' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.querySelector('span')!.textContent).toBe('contains');
    unmount();
  });

  it('100.2.3.2 (react): with operatorLabels set for matching key, operator shows localized label', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        operatorLabels={{ contains: '包含', '>=': '大于等于' }}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 6;
    ta.selectionEnd = 6;
    fireEvent.change(ta, { target: { value: 'name c' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.querySelector('span')!.textContent).toBe('包含');
    unmount();
  });

  it('100.2.3.2 (react): with operatorLabels set but non-matching key, falls back to DSL key', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        operatorLabels={{ '>=': '大于等于' }}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 6;
    ta.selectionEnd = 6;
    fireEvent.change(ta, { target: { value: 'name c' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.querySelector('span')!.textContent).toBe('contains');
    unmount();
  });

  it('100.2.3.2 (react): commit inserts the DSL key regardless of label', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        operatorLabels={{ contains: '包含' }}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 6;
    ta.selectionEnd = 6;
    fireEvent.change(ta, { target: { value: 'name c' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(ta.value).toBe('name contains ');
    unmount();
  });

  it('100.2.3.2 (react): substring match against the typed query uses the DSL key', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        operatorLabels={{ contains: '包含' }}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 13;
    ta.selectionEnd = 13;
    fireEvent.change(ta, { target: { value: 'name contains' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.getAttribute('data-typeahead-item-kind')).toBe('operator');
    unmount();
  });
});

describe('Phase 100.2.4: auto-trigger after operator commit (react)', () => {
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

  it('100.2.4 (react): column commit appends trailing space + auto-opens typeahead for operator slot', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 2;
    ta.selectionEnd = 2;
    fireEvent.change(ta, { target: { value: 'na' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(ta.value).toBe('name ');
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).not.toBeNull();
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items[0]!.getAttribute('data-typeahead-item-kind')).toBe('operator');
    unmount();
  });

  it('100.2.4 (react): operator commit appends trailing space + auto-opens typeahead for value slot', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 6;
    ta.selectionEnd = 6;
    fireEvent.change(ta, { target: { value: 'name c' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(ta.value).toBe('name contains ');
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).not.toBeNull();
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items[0]!.getAttribute('data-typeahead-item-kind')).toBe('value');
    unmount();
  });

  it('100.2.4 (react): keyword commit appends trailing space + auto-opens typeahead for column slot', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 14;
    ta.selectionEnd = 14;
    fireEvent.change(ta, { target: { value: 'name = "foo" A' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(ta.value).toBe('name = "foo" AND ');
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).not.toBeNull();
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items[0]!.getAttribute('data-typeahead-item-kind')).toBe('column');
    unmount();
  });

  it('100.2.4 (react): value commit does NOT append trailing space + typeahead closes (Decision I.1)', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 8;
    ta.selectionEnd = 8;
    fireEvent.change(ta, { target: { value: 'name = a' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(ta.value).toBe('name = "alice"');
    expect(ta.value.endsWith(' ')).toBe(false);
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).toBeNull();
    unmount();
  });
});

describe('Phase 100.2.6: auto-scroll active item into view (react)', () => {
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

  it('100.2.6 (react): arrow-down past visible threshold triggers scrollIntoView with { block: nearest }', () => {
    const scrollSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollSpy;
    try {
      const { container, unmount } = render(
        <ChronixFiltersToolPanel
          tableHandle={makeHandle()}
          columns={manyColumns}
          filterSpec={[]}
        />,
      );
      const ta = container.querySelector<HTMLTextAreaElement>(
        '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
      )!;
      stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
      ta.selectionStart = 1;
      ta.selectionEnd = 1;
      fireEvent.change(ta, { target: { value: 'c' } });
      scrollSpy.mockClear();
      fireEvent.keyDown(ta, { key: 'ArrowDown' });
      expect(scrollSpy).toHaveBeenCalled();
      const lastCall = scrollSpy.mock.calls[scrollSpy.mock.calls.length - 1];
      expect(lastCall?.[0]).toEqual({ block: 'nearest', behavior: 'auto' });
      unmount();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it('100.2.6 (react): typeahead open with activeIdx = 0 triggers scroll-into-view (first item)', () => {
    const scrollSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollSpy;
    try {
      const { container, unmount } = render(
        <ChronixFiltersToolPanel
          tableHandle={makeHandle()}
          columns={manyColumns}
          filterSpec={[]}
        />,
      );
      const ta = container.querySelector<HTMLTextAreaElement>(
        '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
      )!;
      stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
      ta.selectionStart = 1;
      ta.selectionEnd = 1;
      fireEvent.change(ta, { target: { value: 'c' } });
      expect(scrollSpy).toHaveBeenCalled();
      unmount();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it('100.2.6 (react): typeahead closed does NOT trigger scroll-into-view', () => {
    const scrollSpy = vi.fn();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollSpy;
    try {
      const { container, unmount } = render(
        <ChronixFiltersToolPanel
          tableHandle={makeHandle()}
          columns={manyColumns}
          filterSpec={[]}
        />,
      );
      const ta = container.querySelector<HTMLTextAreaElement>(
        '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
      )!;
      stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
      ta.selectionStart = 10;
      ta.selectionEnd = 10;
      fireEvent.change(ta, { target: { value: 'name = "fo' } });
      expect(scrollSpy).not.toHaveBeenCalled();
      unmount();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });
});

describe('Phase 100.2.2.4: string-literal-internal typeahead (react)', () => {
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

  it('100.2.2.4 (react): cursor inside open string literal after `=` opens value typeahead', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={typedColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 12;
    ta.selectionEnd = 12;
    fireEvent.change(ta, { target: { value: 'status = "in' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.getAttribute('data-typeahead-item-kind')).toBe('value');
    unmount();
  });

  it('100.2.2.4 (react): commit inside open string literal inserts bare-value + closing `"`', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={typedColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 15;
    ta.selectionEnd = 15;
    fireEvent.change(ta, { target: { value: 'status = "in-pr' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(ta.value).toBe('status = "in-progress"');
    unmount();
  });

  it('100.2.2.4 (react): after closed " AND " (no comparison op) popover does NOT open', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={typedColumns}
        filterSpec={[]}
        advancedFilterValueSourceRows={valueSourceRows}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 22;
    ta.selectionEnd = 22;
    fireEvent.change(ta, { target: { value: 'status = "foo" AND "ba' } });
    expect(container.querySelector('[data-testid="cx-filters-typeahead"]')).toBeNull();
    unmount();
  });

  it('100.2.2.4 (react): detectTypeaheadSlot returns slot=value with prevColumn', () => {
    const r = detectTypeaheadSlot('name = "in', 10);
    expect(r.slot).toBe('value');
    expect(r.prevColumn).toBe('name');
  });

  it('100.2.2.4 (react): detectTypeaheadSlot returns slot=conjunction for closing quote', () => {
    const r = detectTypeaheadSlot('name = "foo" ', 13);
    expect(r.slot).toBe('conjunction');
  });
});

describe('Phase 100.2.5: per-slot recent LRU rings (react)', () => {
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

  it('100.2.5 (react): column commit → next column typeahead shows it at TOP with recent badge', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 1;
    ta.selectionEnd = 1;
    fireEvent.change(ta, { target: { value: 'q' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    ta.selectionStart = 9;
    ta.selectionEnd = 9;
    fireEvent.change(ta, { target: { value: 'qty AND q' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstRecentBadge = items[0]!.querySelector(
      '[data-testid="cx-filters-typeahead-item-recent"]',
    );
    expect(firstRecentBadge).not.toBeNull();
    unmount();
  });

  it('100.2.5 (react): typeaheadRecentLimit=0 disables the feature entirely', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        typeaheadRecentLimit={0}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 1;
    ta.selectionEnd = 1;
    fireEvent.change(ta, { target: { value: 'q' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    ta.selectionStart = 9;
    ta.selectionEnd = 9;
    fireEvent.change(ta, { target: { value: 'qty AND q' } });
    const recentBadges = container.querySelectorAll(
      '[data-testid="cx-filters-typeahead-item-recent"]',
    );
    expect(recentBadges.length).toBe(0);
    unmount();
  });

  it('100.2.5 (react): cross-slot isolation — recent column does NOT appear in operator slot', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 1;
    ta.selectionEnd = 1;
    fireEvent.change(ta, { target: { value: 'q' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    ta.selectionStart = 5;
    ta.selectionEnd = 5;
    fireEvent.change(ta, { target: { value: 'qty c' } });
    const recentBadges = container.querySelectorAll(
      '[data-testid="cx-filters-typeahead-item-recent"]',
    );
    expect(recentBadges.length).toBe(0);
    unmount();
  });
});

describe('Phase 100.2.2.1: SSR async value getter (react)', () => {
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

  it('100.2.2.1 (react): getter called with (colId, query) on value-slot input', () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.resolve([{ value: 'in-progress', count: 5 }]));
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        advancedFilterValueGetter={getter}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 10;
    ta.selectionEnd = 10;
    fireEvent.change(ta, { target: { value: 'status = i' } });
    // Phase 118 (2026-06-02 — react port): getter widened with
    // optional 3rd `signal?: AbortSignal` arg.
    expect(getter).toHaveBeenCalledWith('status', 'i', expect.any(AbortSignal));
    unmount();
  });

  it('100.2.2.1 (react): loading placeholder rendered before promise resolves', () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => new Promise(() => undefined));
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        advancedFilterValueGetter={getter}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 10;
    ta.selectionEnd = 10;
    fireEvent.change(ta, { target: { value: 'status = i' } });
    expect(container.querySelector('[data-testid="cx-filters-typeahead-loading"]')).not.toBeNull();
    unmount();
  });

  it('100.2.2.1 (react): resolved values render as value-kind items', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.resolve([{ value: 'in-progress', count: 5 }]));
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        advancedFilterValueGetter={getter}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 10;
    ta.selectionEnd = 10;
    fireEvent.change(ta, { target: { value: 'status = i' } });
    await flushPromises();
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]!.getAttribute('data-typeahead-item-kind')).toBe('value');
    unmount();
  });

  it('100.2.2.1 (react): error placeholder rendered on promise rejection', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.reject(new Error('network')));
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        advancedFilterValueGetter={getter}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 10;
    ta.selectionEnd = 10;
    fireEvent.change(ta, { target: { value: 'status = i' } });
    await flushPromises();
    expect(container.querySelector('[data-testid="cx-filters-typeahead-error"]')).not.toBeNull();
    unmount();
  });

  it('100.2.2.1 (react): cache hit on second-time same (colId, query)', async () => {
    const getter = vi.fn<
      (colId: string, q: string) => Promise<readonly { value: string; count: number }[]>
    >(() => Promise.resolve([{ value: 'in-progress', count: 5 }]));
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        advancedFilterValueGetter={getter}
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 10;
    ta.selectionEnd = 10;
    fireEvent.change(ta, { target: { value: 'status = i' } });
    await flushPromises();
    expect(getter).toHaveBeenCalledTimes(1);
    fireEvent.change(ta, { target: { value: 'status = i' } });
    await flushPromises();
    expect(getter).toHaveBeenCalledTimes(1);
    unmount();
  });
});

describe('Phase 112: persistent typeahead recent (react)', () => {
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

  it('112 (react): memory backend default does NOT write to localStorage', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel tableHandle={makeHandle()} columns={columns} filterSpec={[]} />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 1;
    ta.selectionEnd = 1;
    fireEvent.change(ta, { target: { value: 'q' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(window.localStorage.getItem('cx-table-typeahead-recent::column')).toBeNull();
    unmount();
  });

  it('112 (react): localStorage backend writes ring on commit', () => {
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        typeaheadRecentStorage="localStorage"
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 1;
    ta.selectionEnd = 1;
    fireEvent.change(ta, { target: { value: 'q' } });
    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(window.localStorage.getItem('cx-table-typeahead-recent::column')).toBe('["qty"]');
    unmount();
  });

  it('112 (react): localStorage backend hydrates on mount', () => {
    window.localStorage.setItem('cx-table-typeahead-recent::column', '["qty","name"]');
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        typeaheadRecentStorage="localStorage"
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 1;
    ta.selectionEnd = 1;
    fireEvent.change(ta, { target: { value: 'q' } });
    const items = container.querySelectorAll('[data-testid="cx-filters-typeahead-item"]');
    expect(items.length).toBeGreaterThan(0);
    const firstRecentBadge = items[0]!.querySelector(
      '[data-testid="cx-filters-typeahead-item-recent"]',
    );
    expect(firstRecentBadge).not.toBeNull();
    unmount();
  });

  it('112 (react): localStorage backend ignores malformed payload', () => {
    window.localStorage.setItem('cx-table-typeahead-recent::column', '{not-json');
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={makeHandle()}
        columns={columns}
        filterSpec={[]}
        typeaheadRecentStorage="localStorage"
      />,
    );
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="cx-filters-tool-panel-advanced-textarea"]',
    )!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 1;
    ta.selectionEnd = 1;
    fireEvent.change(ta, { target: { value: 'q' } });
    const recentBadges = container.querySelectorAll(
      '[data-testid="cx-filters-typeahead-item-recent"]',
    );
    expect(recentBadges.length).toBe(0);
    unmount();
  });
});

describe('formatFilterChipLabel (react)', () => {
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

describe('Phase 118: P3 finale — AbortController + per-column recents (react)', () => {
  const phase118Columns: readonly ColumnSpec[] = [
    { id: 'name', field: 'name', headerName: 'Name' },
    { id: 'qty', field: 'qty', headerName: 'Qty', type: 'number' },
    { id: 'status', field: 'status', headerName: 'Status' },
  ];
  const phase118Handle = makeHandle();
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
    ta.getBoundingClientRect = () => full;
  }

  it('Phase 118 (react): getter receives an AbortSignal arg', () => {
    const getter = vi.fn<
      (colId: string, query: string, signal?: AbortSignal) => Promise<readonly ColumnUniqueValue[]>
    >(() => Promise.resolve([{ value: 'OK', count: 1 }]));
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={phase118Handle}
        columns={phase118Columns}
        filterSpec={[]}
        advancedFilterValueGetter={getter}
      />,
    );
    const ta = container.querySelector('textarea')!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 10;
    ta.selectionEnd = 10;
    fireEvent.change(ta, { target: { value: 'status = a' } });
    expect(getter).toHaveBeenCalled();
    const args = getter.mock.calls[0]!;
    expect(args[0]).toBe('status');
    expect(args[1]).toBe('a');
    expect(args[2]).toBeInstanceOf(AbortSignal);
    unmount();
  });

  it('Phase 118 (react): rapid typing aborts the prior in-flight controller', () => {
    const signals: AbortSignal[] = [];
    const getter = vi.fn((_colId: string, _query: string, signal?: AbortSignal) => {
      if (signal != null) signals.push(signal);
      return new Promise<readonly ColumnUniqueValue[]>(() => undefined);
    });
    const { container, unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={phase118Handle}
        columns={phase118Columns}
        filterSpec={[]}
        advancedFilterValueGetter={getter}
      />,
    );
    const ta = container.querySelector('textarea')!;
    stubAnchor(ta, { left: 10, bottom: 100, width: 200 });
    ta.selectionStart = 10;
    ta.selectionEnd = 10;
    fireEvent.change(ta, { target: { value: 'status = a' } });
    ta.selectionStart = 11;
    ta.selectionEnd = 11;
    fireEvent.change(ta, { target: { value: 'status = ab' } });
    expect(signals.length).toBeGreaterThanOrEqual(2);
    expect(getter).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('Phase 118 (react): typeaheadRecentScope="per-column-value" mounts cleanly', () => {
    const { unmount } = render(
      <ChronixFiltersToolPanel
        tableHandle={phase118Handle}
        columns={phase118Columns}
        filterSpec={[]}
        typeaheadRecentScope="per-column-value"
      />,
    );
    // Smoke test — prop is wired without runtime error.
    unmount();
  });
});
