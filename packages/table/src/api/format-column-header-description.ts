import type { ColumnSpec, FilterSpec, SortSpec } from '../ir/index.js';

/**
 * input to `formatColumnHeaderDescription`.
 *
 * The helper composes a human-readable description of a column's
 * current sort + filter state. The output is consumed by the SFC's
 * visually-hidden description span (referenced via `aria-describedby`
 * on the columnheader) so screen-reader users hear "Name, sorted
 * ascending" / "Qty, filter contains 10" when their cursor lands on
 * the column header.
 */
export interface FormatColumnHeaderDescriptionInput {
  readonly column: ColumnSpec;
  readonly sortSpec: readonly SortSpec[];
  readonly filterSpec: readonly FilterSpec[];
}

/**
 * produce the description string referenced
 * by the columnheader's `aria-describedby` attribute.
 *
 * Format:
 * - No state → empty string.
 * - Sort only: `"sorted ascending"` / `"sorted descending"`. When
 *   `sortSpec.length > 1` AND the column appears in it, append the
 *   1-based position: `"sorted ascending, position 2"`.
 * - Filter only (text variant): `'filter contains "X"'` /
 *   `'filter equals "X"'` / `'filter starts with "X"'` /
 *   `'filter ends with "X"'`. Empty filter value (`value === ''`)
 *   counts as no filter (matches `filterPass` semantics).
 * - Filter only (number variant): `'filter = 10'` / `'filter > 10'` /
 *   `'filter < 10'` / `'filter >= 10'` / `'filter <= 10'` /
 *   `'filter in range 10 to 30'`.
 * - Both sort + filter → semicolon-separated: `"sorted ascending;
 *   filter contains \"X\""`.
 *
 * Pure function. Stable for unit testing; SFC binds the output
 * directly into the description span's text content.
 */
export function formatColumnHeaderDescription(input: FormatColumnHeaderDescriptionInput): string {
  const { column, sortSpec, filterSpec } = input;

  const parts: string[] = [];

  const sortPart = describeSort(column, sortSpec);
  if (sortPart !== '') parts.push(sortPart);

  const filterPart = describeFilter(column, filterSpec);
  if (filterPart !== '') parts.push(filterPart);

  return parts.join('; ');
}

function describeSort(column: ColumnSpec, sortSpec: readonly SortSpec[]): string {
  if (sortSpec.length === 0) return '';
  const index = sortSpec.findIndex((s) => s.colId === column.id);
  if (index < 0) return '';
  const entry = sortSpec[index]!;
  const direction = entry.direction === 'desc' ? 'descending' : 'ascending';
  if (sortSpec.length > 1) {
    return `sorted ${direction}, position ${index + 1}`;
  }
  return `sorted ${direction}`;
}

function describeFilter(column: ColumnSpec, filterSpec: readonly FilterSpec[]): string {
  const entry = filterSpec.find((s) => s.type !== 'expression' && s.colId === column.id);
  if (entry == null || entry.type === 'expression') return '';

  if (entry.type === 'text') {
    if (entry.value === '') return '';
    const opLabel = textOperatorLabel(entry.operator);
    return `filter ${opLabel} "${entry.value}"`;
  }

  if (entry.type === 'number') {
    if (entry.operator === 'inRange') {
      const valueTo = entry.valueTo ?? entry.value;
      return `filter in range ${entry.value} to ${valueTo}`;
    }
    const opLabel = numberOperatorLabel(entry.operator);
    return `filter ${opLabel} ${entry.value}`;
  }

  return '';
}

function textOperatorLabel(operator: 'contains' | 'equals' | 'startsWith' | 'endsWith'): string {
  switch (operator) {
    case 'contains':
      return 'contains';
    case 'equals':
      return 'equals';
    case 'startsWith':
      return 'starts with';
    case 'endsWith':
      return 'ends with';
  }
}

function numberOperatorLabel(operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'inRange'): string {
  switch (operator) {
    case '=':
      return '=';
    case '!=':
      return '!=';
    case '>':
      return '>';
    case '<':
      return '<';
    case '>=':
      return '>=';
    case '<=':
      return '<=';
    case 'inRange':
      // Handled by caller; included for exhaustiveness.
      return 'in range';
  }
}
