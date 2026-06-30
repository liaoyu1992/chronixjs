import { describe, expect, it } from 'vitest';

import { parseFilterExpression } from './parse-filter-expression.js';

import type { ColumnSpec } from '../ir/index.js';

const columns: readonly ColumnSpec[] = [
  { id: 'name', headerName: 'Name', type: 'text' },
  { id: 'qty', headerName: 'Qty', type: 'number' },
  { id: 'status', headerName: 'Status', type: 'text' },
  { id: 'flag', headerName: 'Flag', type: 'boolean' },
  { id: 'secret', headerName: 'Secret', type: 'text', filterable: false },
];

describe('parseFilterExpression ', () => {
  it('returns null expression for empty input', () => {
    const result = parseFilterExpression('', { columns });
    expect(result).toEqual({ ok: true, expression: null });
  });

  it('returns null expression for whitespace-only input', () => {
    const result = parseFilterExpression('   \t \n  ', { columns });
    expect(result).toEqual({ ok: true, expression: null });
  });

  it('parses single string equality', () => {
    const result = parseFilterExpression('name = "alpha"', { columns });
    expect(result).toEqual({
      ok: true,
      expression: { kind: 'compare', colId: 'name', operator: '=', value: 'alpha' },
    });
  });

  it('parses all 6 binary operators', () => {
    for (const op of ['=', '!=', '>', '<', '>=', '<='] as const) {
      const result = parseFilterExpression(`qty ${op} 5`, { columns });
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.expression).toEqual({
        kind: 'compare',
        colId: 'qty',
        operator: op,
        value: 5,
      });
    }
  });

  it('accepts <> as alias for !=', () => {
    const result = parseFilterExpression('qty <> 10', { columns });
    expect(result).toEqual({
      ok: true,
      expression: { kind: 'compare', colId: 'qty', operator: '!=', value: 10 },
    });
  });

  it('parses CONTAINS / STARTS_WITH / ENDS_WITH', () => {
    const map = {
      CONTAINS: 'contains',
      STARTS_WITH: 'startsWith',
      ENDS_WITH: 'endsWith',
    } as const;
    for (const [kw, op] of Object.entries(map)) {
      const result = parseFilterExpression(`name ${kw} "alpha"`, { columns });
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.expression).toEqual({
        kind: 'compare',
        colId: 'name',
        operator: op,
        value: 'alpha',
      });
    }
  });

  it('parses IN list', () => {
    const result = parseFilterExpression('status IN ("a", "b", "c")', { columns });
    expect(result).toEqual({
      ok: true,
      expression: {
        kind: 'compare',
        colId: 'status',
        operator: 'in',
        value: ['a', 'b', 'c'],
      },
    });
  });

  it('parses IS NULL', () => {
    const result = parseFilterExpression('name IS NULL', { columns });
    expect(result).toEqual({
      ok: true,
      expression: { kind: 'compare', colId: 'name', operator: 'isNull', value: null },
    });
  });

  it('parses IS NOT NULL', () => {
    const result = parseFilterExpression('name IS NOT NULL', { columns });
    expect(result).toEqual({
      ok: true,
      expression: { kind: 'compare', colId: 'name', operator: 'isNotNull', value: null },
    });
  });

  it('parses AND chain into and-node', () => {
    const result = parseFilterExpression('qty > 1 AND qty < 10', { columns });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.expression).toMatchObject({
      kind: 'and',
      children: [
        { kind: 'compare', colId: 'qty', operator: '>', value: 1 },
        { kind: 'compare', colId: 'qty', operator: '<', value: 10 },
      ],
    });
  });

  it('parses OR chain into or-node', () => {
    const result = parseFilterExpression('qty < 1 OR qty > 10', { columns });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.expression).toMatchObject({
      kind: 'or',
      children: [
        { kind: 'compare', colId: 'qty', operator: '<', value: 1 },
        { kind: 'compare', colId: 'qty', operator: '>', value: 10 },
      ],
    });
  });

  it('wraps a NOT', () => {
    const result = parseFilterExpression('NOT name = "skip"', { columns });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.expression).toMatchObject({
      kind: 'not',
      child: { kind: 'compare', colId: 'name', operator: '=', value: 'skip' },
    });
  });

  it('honors NOT > AND > OR precedence', () => {
    const result = parseFilterExpression('qty > 1 OR qty < 5 AND name = "a"', { columns });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.expression).toMatchObject({
      kind: 'or',
      children: [
        { kind: 'compare', colId: 'qty', operator: '>', value: 1 },
        {
          kind: 'and',
          children: [
            { kind: 'compare', colId: 'qty', operator: '<', value: 5 },
            { kind: 'compare', colId: 'name', operator: '=', value: 'a' },
          ],
        },
      ],
    });
  });

  it('parens override precedence', () => {
    const result = parseFilterExpression('(qty > 1 OR qty < 5) AND name = "a"', { columns });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.expression).toMatchObject({
      kind: 'and',
      children: [
        {
          kind: 'or',
          children: [
            { kind: 'compare', colId: 'qty', operator: '>', value: 1 },
            { kind: 'compare', colId: 'qty', operator: '<', value: 5 },
          ],
        },
        { kind: 'compare', colId: 'name', operator: '=', value: 'a' },
      ],
    });
  });

  it('double-NOT wraps twice', () => {
    const result = parseFilterExpression('NOT NOT qty > 1', { columns });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.expression).toMatchObject({
      kind: 'not',
      child: {
        kind: 'not',
        child: { kind: 'compare', colId: 'qty', operator: '>', value: 1 },
      },
    });
  });

  it('accepts case-insensitive keywords', () => {
    const a = parseFilterExpression('qty > 1 AND qty < 5', { columns });
    const b = parseFilterExpression('qty > 1 and qty < 5', { columns });
    const c = parseFilterExpression('qty > 1 And qty < 5', { columns });
    expect(a).toEqual(b);
    expect(a).toEqual(c);
  });

  it('accepts single-quoted strings', () => {
    const a = parseFilterExpression(`name = "alpha"`, { columns });
    const b = parseFilterExpression(`name = 'alpha'`, { columns });
    expect(a).toEqual(b);
  });

  it('parses positive / negative / decimal numbers', () => {
    const cases = [
      ['qty = 5', 5],
      ['qty = -5', -5],
      ['qty = 3.14', 3.14],
      ['qty = -0.5', -0.5],
    ] as const;
    for (const [text, expected] of cases) {
      const result = parseFilterExpression(text, { columns });
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.expression).toMatchObject({
        kind: 'compare',
        colId: 'qty',
        operator: '=',
        value: expected,
      });
    }
  });

  it('parses TRUE / FALSE boolean literals', () => {
    const t = parseFilterExpression('flag = TRUE', { columns });
    const f = parseFilterExpression('flag = FALSE', { columns });
    expect(t).toEqual({
      ok: true,
      expression: { kind: 'compare', colId: 'flag', operator: '=', value: true },
    });
    expect(f).toEqual({
      ok: true,
      expression: { kind: 'compare', colId: 'flag', operator: '=', value: false },
    });
  });

  it('accepts NULL literal as compare value', () => {
    const result = parseFilterExpression('name = NULL', { columns });
    expect(result).toEqual({
      ok: true,
      expression: { kind: 'compare', colId: 'name', operator: '=', value: null },
    });
  });

  it('rejects unknown column identifier', () => {
    const result = parseFilterExpression('unknownCol = 5', { columns });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.message).toContain('unknown column');
    expect(result.errors[0]?.position).toBe(0);
  });

  it('rejects filterable:false column reference', () => {
    const result = parseFilterExpression('secret = "x"', { columns });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.message).toContain('not filterable');
  });

  it('reports unclosed string', () => {
    const result = parseFilterExpression('name = "alpha', { columns });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.message).toContain('unclosed string');
  });

  it('reports unclosed paren', () => {
    const result = parseFilterExpression('(qty > 1', { columns });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.message).toContain(`)`);
  });

  it('reports unexpected operator after invalid sequence', () => {
    const result = parseFilterExpression('qty UNKNOWN_OP 5', { columns });
    expect(result.ok).toBe(false);
  });

  it('reports trailing tokens after a valid expression', () => {
    const result = parseFilterExpression('qty > 1 garbage', { columns });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.message.includes('trailing'))).toBe(true);
  });

  it('reports invalid IN list (missing literal)', () => {
    const result = parseFilterExpression('status IN ()', { columns });
    expect(result.ok).toBe(false);
  });

  it('collects multiple errors up to maxErrors', () => {
    const result = parseFilterExpression('unknownA = 1', { columns, maxErrors: 5 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.length).toBeLessThanOrEqual(5);
  });

  it('caps errors at limit when many errors present', () => {
    // construct a deliberately broken stream; the cap exists for runaway
    // errors.
    const result = parseFilterExpression('badidA = badidB = badidC = 1', {
      columns,
      maxErrors: 2,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.length).toBeLessThanOrEqual(2);
  });
});
