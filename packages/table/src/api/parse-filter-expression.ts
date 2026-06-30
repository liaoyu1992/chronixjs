import type {
  ColumnSpec,
  ExpressionOperator,
  ExpressionScalar,
  FilterExpression,
} from '../ir/index.js';

/**
 * Parser options (2026-05-29).
 *
 * - `columns` provides the universe of valid column identifiers
 *   referenced by `ident` tokens. Unknown identifiers and identifiers
 *   pointing at columns with `filterable === false` surface as parse
 *   errors with their original token position so consumers can
 *   render token-level error UIs.
 * - `maxErrors` caps the error array length. Defaults to 10. When
 *   the cap is reached the parser pushes a sentinel error and bails.
 */
export interface ParseFilterExpressionOptions {
  readonly columns: readonly ColumnSpec[];
  readonly maxErrors?: number;
}

/**
 * Single parse error. `position` is the 0-based byte offset of the
 * offending token in the input text — consumers can render an
 * underline-the-token affordance against this.
 */
export interface ParseFilterExpressionError {
  readonly message: string;
  readonly position: number;
}

/**
 * Discriminated parser result. The `ok: true` branch carries an
 * `expression` that is either the parsed `FilterExpression` or `null`
 * when the input was empty / whitespace-only (canonical identity
 * case so consumers can drive a debounced text input without
 * special-casing).
 */
export type ParseFilterExpressionResult =
  | { readonly ok: true; readonly expression: FilterExpression | null }
  | { readonly ok: false; readonly errors: readonly ParseFilterExpressionError[] };

const DEFAULT_MAX_ERRORS = 10;

interface Token {
  readonly kind: TokenKind;
  readonly text: string;
  readonly position: number;
}

type TokenKind =
  | 'ident'
  | 'string'
  | 'number'
  | 'keyword'
  | 'operator'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'eof';

const KEYWORDS = new Set([
  'AND',
  'OR',
  'NOT',
  'IN',
  'IS',
  'NULL',
  'TRUE',
  'FALSE',
  'CONTAINS',
  'STARTS_WITH',
  'ENDS_WITH',
]);

/**
 * Parse a filter-expression DSL string into a `FilterExpression` IR
 * tree (2026-05-29).
 *
 * Empty / whitespace-only input → `{ok: true, expression: null}` —
 * the canonical "no filter" identity case. Single or multiple parse
 * errors → `{ok: false, errors: [...]}` (up to `maxErrors`).
 *
 * Grammar (per design doc Decision B.1, SQL-style
 * precedence `NOT > AND > OR`):
 *
 * ```ebnf
 * expr     := orExpr
 * orExpr   := andExpr ( "OR" andExpr )*
 * andExpr  := notExpr ( "AND" notExpr )*
 * notExpr  := "NOT" notExpr | atom
 * atom     := "(" expr ")" | compare
 * compare  := ident binaryOp value
 *           | ident "IN" "(" value ("," value)* ")"
 *           | ident "IS" "NOT"? "NULL"
 * ```
 *
 * Pure function. No side effects.
 */
export function parseFilterExpression(
  text: string,
  options: ParseFilterExpressionOptions,
): ParseFilterExpressionResult {
  const maxErrors = options.maxErrors ?? DEFAULT_MAX_ERRORS;
  const columnsById = new Map<string, ColumnSpec>();
  for (const column of options.columns) {
    columnsById.set(column.id, column);
  }

  const tokens = tokenize(text, columnsById);
  if (tokens.errors.length > 0) {
    return { ok: false, errors: capErrors(tokens.errors, maxErrors) };
  }

  // Empty / whitespace-only: tokenizer returns just an EOF token.
  if (tokens.tokens.length === 1 && tokens.tokens[0]?.kind === 'eof') {
    return { ok: true, expression: null };
  }

  const parser = new Parser(tokens.tokens, columnsById, maxErrors);
  const expression = parser.parseExpression();
  if (parser.errors.length > 0) {
    return { ok: false, errors: capErrors(parser.errors, maxErrors) };
  }
  if (expression == null) {
    return {
      ok: false,
      errors: [{ message: 'expected expression', position: 0 }],
    };
  }
  return { ok: true, expression };
}

function capErrors(
  errors: readonly ParseFilterExpressionError[],
  maxErrors: number,
): readonly ParseFilterExpressionError[] {
  if (errors.length <= maxErrors) return errors;
  const truncated = errors.slice(0, maxErrors);
  const last = errors[maxErrors - 1];
  const position = last?.position ?? 0;
  return [
    ...truncated.slice(0, -1),
    {
      message: `too many errors (cap ${maxErrors}); stopping after ${maxErrors}`,
      position,
    },
  ];
}

interface TokenizeResult {
  readonly tokens: readonly Token[];
  readonly errors: readonly ParseFilterExpressionError[];
}

function tokenize(text: string, _columnsById: ReadonlyMap<string, ColumnSpec>): TokenizeResult {
  const tokens: Token[] = [];
  const errors: ParseFilterExpressionError[] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i] ?? '';

    if (isWhitespace(ch)) {
      i += 1;
      continue;
    }

    if (ch === '(') {
      tokens.push({ kind: 'lparen', text: '(', position: i });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen', text: ')', position: i });
      i += 1;
      continue;
    }
    if (ch === ',') {
      tokens.push({ kind: 'comma', text: ',', position: i });
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const start = i;
      const quote = ch;
      i += 1;
      let value = '';
      let closed = false;
      while (i < len) {
        const c = text[i] ?? '';
        if (c === quote) {
          closed = true;
          i += 1;
          break;
        }
        value += c;
        i += 1;
      }
      if (!closed) {
        errors.push({ message: 'unclosed string literal', position: start });
      } else {
        tokens.push({ kind: 'string', text: value, position: start });
      }
      continue;
    }

    if (isDigit(ch) || (ch === '-' && isDigit(text[i + 1] ?? ''))) {
      const start = i;
      if (ch === '-') i += 1;
      while (i < len && isDigit(text[i] ?? '')) i += 1;
      if (text[i] === '.') {
        i += 1;
        while (i < len && isDigit(text[i] ?? '')) i += 1;
      }
      tokens.push({ kind: 'number', text: text.slice(start, i), position: start });
      continue;
    }

    if (ch === '!' && text[i + 1] === '=') {
      tokens.push({ kind: 'operator', text: '!=', position: i });
      i += 2;
      continue;
    }
    if (ch === '<' && text[i + 1] === '>') {
      tokens.push({ kind: 'operator', text: '!=', position: i });
      i += 2;
      continue;
    }
    if (ch === '>' && text[i + 1] === '=') {
      tokens.push({ kind: 'operator', text: '>=', position: i });
      i += 2;
      continue;
    }
    if (ch === '<' && text[i + 1] === '=') {
      tokens.push({ kind: 'operator', text: '<=', position: i });
      i += 2;
      continue;
    }
    if (ch === '=' || ch === '>' || ch === '<') {
      tokens.push({ kind: 'operator', text: ch, position: i });
      i += 1;
      continue;
    }

    if (isIdentStart(ch)) {
      const start = i;
      while (i < len && isIdentPart(text[i] ?? '')) i += 1;
      const raw = text.slice(start, i);
      const upper = raw.toUpperCase();
      if (KEYWORDS.has(upper)) {
        tokens.push({ kind: 'keyword', text: upper, position: start });
      } else {
        tokens.push({ kind: 'ident', text: raw, position: start });
      }
      continue;
    }

    errors.push({ message: `unexpected character '${ch}'`, position: i });
    i += 1;
  }

  tokens.push({ kind: 'eof', text: '', position: len });
  return { tokens, errors };
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isIdentStart(ch: string): boolean {
  return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_';
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch);
}

class Parser {
  pos = 0;
  readonly errors: ParseFilterExpressionError[] = [];

  constructor(
    private readonly tokens: readonly Token[],
    private readonly columnsById: ReadonlyMap<string, ColumnSpec>,
    private readonly maxErrors: number,
  ) {}

  parseExpression(): FilterExpression | null {
    const expr = this.parseOr();
    const tail = this.peek();
    if (tail.kind !== 'eof' && this.errors.length < this.maxErrors) {
      this.errors.push({
        message: `unexpected trailing token '${tail.text}'`,
        position: tail.position,
      });
    }
    return expr;
  }

  parseOr(): FilterExpression | null {
    const first = this.parseAnd();
    if (first == null) return null;
    const children: FilterExpression[] = [first];
    while (this.matchKeyword('OR')) {
      const next = this.parseAnd();
      if (next == null) return null;
      children.push(next);
    }
    if (children.length === 1) return children[0] ?? null;
    return { kind: 'or', children };
  }

  parseAnd(): FilterExpression | null {
    const first = this.parseNot();
    if (first == null) return null;
    const children: FilterExpression[] = [first];
    while (this.matchKeyword('AND')) {
      const next = this.parseNot();
      if (next == null) return null;
      children.push(next);
    }
    if (children.length === 1) return children[0] ?? null;
    return { kind: 'and', children };
  }

  parseNot(): FilterExpression | null {
    if (this.matchKeyword('NOT')) {
      const child = this.parseNot();
      if (child == null) return null;
      return { kind: 'not', child };
    }
    return this.parseAtom();
  }

  parseAtom(): FilterExpression | null {
    const tok = this.peek();
    if (tok.kind === 'lparen') {
      this.advance();
      const inner = this.parseOr();
      if (inner == null) return null;
      const close = this.peek();
      if (close.kind !== 'rparen') {
        this.error(`expected ')'`, close.position);
        return null;
      }
      this.advance();
      return inner;
    }
    return this.parseCompare();
  }

  parseCompare(): FilterExpression | null {
    const identTok = this.peek();
    if (identTok.kind !== 'ident') {
      this.error(`expected column identifier, got '${identTok.text}'`, identTok.position);
      return null;
    }
    this.advance();

    const column = this.columnsById.get(identTok.text);
    if (column == null) {
      this.error(`unknown column '${identTok.text}'`, identTok.position);
      return null;
    }
    if (column.filterable === false) {
      this.error(`column '${identTok.text}' is not filterable`, identTok.position);
      return null;
    }

    const opTok = this.peek();

    if (opTok.kind === 'keyword' && opTok.text === 'IS') {
      this.advance();
      const next = this.peek();
      if (next.kind === 'keyword' && next.text === 'NOT') {
        this.advance();
        if (!this.expectKeyword('NULL')) return null;
        return {
          kind: 'compare',
          colId: identTok.text,
          operator: 'isNotNull',
          value: null,
        };
      }
      if (!this.expectKeyword('NULL')) return null;
      return {
        kind: 'compare',
        colId: identTok.text,
        operator: 'isNull',
        value: null,
      };
    }

    if (opTok.kind === 'keyword' && opTok.text === 'IN') {
      this.advance();
      const open = this.peek();
      if (open.kind !== 'lparen') {
        this.error(`expected '(' after IN`, open.position);
        return null;
      }
      this.advance();
      const values: ExpressionScalar[] = [];
      const first = this.parseValueLiteral();
      if (first === SENTINEL_INVALID) return null;
      values.push(first);
      while (this.peek().kind === 'comma') {
        this.advance();
        const next = this.parseValueLiteral();
        if (next === SENTINEL_INVALID) return null;
        values.push(next);
      }
      const close = this.peek();
      if (close.kind !== 'rparen') {
        this.error(`expected ')' to close IN list`, close.position);
        return null;
      }
      this.advance();
      return {
        kind: 'compare',
        colId: identTok.text,
        operator: 'in',
        value: values,
      };
    }

    if (opTok.kind === 'operator') {
      const operator = opTok.text as ExpressionOperator;
      this.advance();
      const value = this.parseValueLiteral();
      if (value === SENTINEL_INVALID) return null;
      return {
        kind: 'compare',
        colId: identTok.text,
        operator,
        value,
      };
    }

    if (opTok.kind === 'keyword') {
      if (opTok.text === 'CONTAINS') {
        this.advance();
        const v = this.parseValueLiteral();
        if (v === SENTINEL_INVALID) return null;
        return { kind: 'compare', colId: identTok.text, operator: 'contains', value: v };
      }
      if (opTok.text === 'STARTS_WITH') {
        this.advance();
        const v = this.parseValueLiteral();
        if (v === SENTINEL_INVALID) return null;
        return { kind: 'compare', colId: identTok.text, operator: 'startsWith', value: v };
      }
      if (opTok.text === 'ENDS_WITH') {
        this.advance();
        const v = this.parseValueLiteral();
        if (v === SENTINEL_INVALID) return null;
        return { kind: 'compare', colId: identTok.text, operator: 'endsWith', value: v };
      }
    }

    this.error(`expected operator after '${identTok.text}', got '${opTok.text}'`, opTok.position);
    return null;
  }

  parseValueLiteral(): ExpressionScalar | typeof SENTINEL_INVALID {
    const tok = this.peek();
    if (tok.kind === 'string') {
      this.advance();
      return tok.text;
    }
    if (tok.kind === 'number') {
      this.advance();
      const n = Number(tok.text);
      if (!Number.isFinite(n)) {
        this.error(`invalid number literal '${tok.text}'`, tok.position);
        return SENTINEL_INVALID;
      }
      return n;
    }
    if (tok.kind === 'keyword') {
      if (tok.text === 'TRUE') {
        this.advance();
        return true;
      }
      if (tok.text === 'FALSE') {
        this.advance();
        return false;
      }
      if (tok.text === 'NULL') {
        this.advance();
        return null;
      }
    }
    this.error(`expected literal value, got '${tok.text}'`, tok.position);
    return SENTINEL_INVALID;
  }

  peek(): Token {
    return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1]!;
  }

  advance(): Token {
    const tok = this.peek();
    if (tok.kind !== 'eof') this.pos += 1;
    return tok;
  }

  matchKeyword(keyword: string): boolean {
    const tok = this.peek();
    if (tok.kind === 'keyword' && tok.text === keyword) {
      this.advance();
      return true;
    }
    return false;
  }

  expectKeyword(keyword: string): boolean {
    const tok = this.peek();
    if (tok.kind === 'keyword' && tok.text === keyword) {
      this.advance();
      return true;
    }
    this.error(`expected keyword '${keyword}', got '${tok.text}'`, tok.position);
    return false;
  }

  error(message: string, position: number): void {
    if (this.errors.length < this.maxErrors) {
      this.errors.push({ message, position });
    }
  }
}

const SENTINEL_INVALID = Symbol('parse-filter-expression invalid value');
