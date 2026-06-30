import { describe, expect, it } from 'vitest';

import { buildExpressionPredicate } from './evaluate-filter-expression.js';

import type { ColumnSpec, FilterExpression, RowSpec } from '../ir/index.js';

const columns: readonly ColumnSpec[] = [
  { id: 'name', headerName: 'Name', type: 'text' },
  { id: 'qty', headerName: 'Qty', type: 'number' },
  { id: 'status', headerName: 'Status', type: 'text' },
  { id: 'flag', headerName: 'Flag', type: 'boolean' },
  {
    id: 'computed',
    headerName: 'Computed',
    type: 'number',
    valueGetter: ({ row }) => Number(row.data['qty']) * 2,
  },
];

function row(id: string, data: Record<string, unknown>): RowSpec {
  return { id, data };
}

describe('buildExpressionPredicate ', () => {
  it('matches single text equality', () => {
    const expr: FilterExpression = {
      kind: 'compare',
      colId: 'name',
      operator: '=',
      value: 'alpha',
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { name: 'alpha' }))).toBe(true);
    expect(pred(row('2', { name: 'beta' }))).toBe(false);
  });

  it('matches single number compare', () => {
    const expr: FilterExpression = {
      kind: 'compare',
      colId: 'qty',
      operator: '>',
      value: 5,
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { qty: 10 }))).toBe(true);
    expect(pred(row('2', { qty: 3 }))).toBe(false);
    expect(pred(row('3', { qty: 5 }))).toBe(false);
  });

  it('AND requires every child to match', () => {
    const expr: FilterExpression = {
      kind: 'and',
      children: [
        { kind: 'compare', colId: 'qty', operator: '>', value: 1 },
        { kind: 'compare', colId: 'qty', operator: '<', value: 10 },
      ],
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { qty: 5 }))).toBe(true);
    expect(pred(row('2', { qty: 0 }))).toBe(false);
    expect(pred(row('3', { qty: 20 }))).toBe(false);
  });

  it('OR matches when any child matches', () => {
    const expr: FilterExpression = {
      kind: 'or',
      children: [
        { kind: 'compare', colId: 'qty', operator: '<', value: 1 },
        { kind: 'compare', colId: 'qty', operator: '>', value: 10 },
      ],
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { qty: 0 }))).toBe(true);
    expect(pred(row('2', { qty: 20 }))).toBe(true);
    expect(pred(row('3', { qty: 5 }))).toBe(false);
  });

  it('NOT inverts the inner predicate', () => {
    const expr: FilterExpression = {
      kind: 'not',
      child: { kind: 'compare', colId: 'name', operator: '=', value: 'skip' },
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { name: 'alpha' }))).toBe(true);
    expect(pred(row('2', { name: 'skip' }))).toBe(false);
  });

  it('IN matches any list entry', () => {
    const expr: FilterExpression = {
      kind: 'compare',
      colId: 'status',
      operator: 'in',
      value: ['active', 'pending'],
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { status: 'active' }))).toBe(true);
    expect(pred(row('2', { status: 'pending' }))).toBe(true);
    expect(pred(row('3', { status: 'archived' }))).toBe(false);
  });

  it('IS NULL matches null / undefined / missing cells', () => {
    const expr: FilterExpression = {
      kind: 'compare',
      colId: 'name',
      operator: 'isNull',
      value: null,
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { name: null }))).toBe(true);
    expect(pred(row('2', { name: undefined }))).toBe(true);
    expect(pred(row('3', {}))).toBe(true);
    expect(pred(row('4', { name: 'present' }))).toBe(false);
  });

  it('IS NOT NULL matches non-null cells', () => {
    const expr: FilterExpression = {
      kind: 'compare',
      colId: 'name',
      operator: 'isNotNull',
      value: null,
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { name: 'x' }))).toBe(true);
    expect(pred(row('2', { name: null }))).toBe(false);
  });

  it('CONTAINS is case-insensitive substring', () => {
    const expr: FilterExpression = {
      kind: 'compare',
      colId: 'name',
      operator: 'contains',
      value: 'Alpha',
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { name: 'an alpha here' }))).toBe(true);
    expect(pred(row('2', { name: 'ALPHA TOWN' }))).toBe(true);
    expect(pred(row('3', { name: 'beta' }))).toBe(false);
  });

  it('number compare fails for non-numeric cell value', () => {
    const expr: FilterExpression = {
      kind: 'compare',
      colId: 'qty',
      operator: '>',
      value: 1,
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { qty: 'not-a-number' }))).toBe(false);
    expect(pred(row('2', { qty: Number.NaN }))).toBe(false);
    expect(pred(row('3', { qty: Number.POSITIVE_INFINITY }))).toBe(false);
  });

  it('honors valueGetter', () => {
    const expr: FilterExpression = {
      kind: 'compare',
      colId: 'computed',
      operator: '=',
      value: 10,
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { qty: 5 }))).toBe(true);
    expect(pred(row('2', { qty: 3 }))).toBe(false);
  });

  it('evaluates nested parens correctly', () => {
    const expr: FilterExpression = {
      kind: 'and',
      children: [
        {
          kind: 'or',
          children: [
            { kind: 'compare', colId: 'qty', operator: '<', value: 1 },
            { kind: 'compare', colId: 'qty', operator: '>', value: 10 },
          ],
        },
        { kind: 'compare', colId: 'name', operator: '=', value: 'keep' },
      ],
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { qty: 0, name: 'keep' }))).toBe(true);
    expect(pred(row('2', { qty: 20, name: 'keep' }))).toBe(true);
    expect(pred(row('3', { qty: 0, name: 'drop' }))).toBe(false);
    expect(pred(row('4', { qty: 5, name: 'keep' }))).toBe(false);
  });

  it('type mismatch (number column vs string literal)', () => {
    const expr: FilterExpression = {
      kind: 'compare',
      colId: 'qty',
      operator: '=',
      value: 'oops',
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { qty: 5 }))).toBe(false);
  });

  it('NULL in IN list matches null cell value', () => {
    const expr: FilterExpression = {
      kind: 'compare',
      colId: 'name',
      operator: 'in',
      value: [null, 'x'],
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { name: null }))).toBe(true);
    expect(pred(row('2', { name: 'x' }))).toBe(true);
    expect(pred(row('3', { name: 'y' }))).toBe(false);
  });

  it('empty IN list never matches', () => {
    const expr: FilterExpression = {
      kind: 'compare',
      colId: 'status',
      operator: 'in',
      value: [],
    };
    const pred = buildExpressionPredicate(expr, { columns });
    expect(pred(row('1', { status: 'anything' }))).toBe(false);
  });
});
