/**
 * pre-built filters tool panel — a vue3
 * functional component the consumer drops in's
 * `ToolPanelDescriptor.renderer` slot.
 *
 * Pure UI wrapper over `TableHandle.setFilter` +
 * `TableHandle.clearFilter` + `TableHandle.setAdvancedFilter` +
 * `TableHandle.parseAndSetAdvancedFilter`. State is consumer-
 * mirrored — the panel reads the active filter list from
 * `props.filterSpec` (the consumer mirrors this via the
 * `filter-change` emit).
 *
 * 3-zone layout per design B.1: sticky header (Clear all
 * filters button) + scrollable body (one chip per FilterSpec
 * entry + advanced-filter textarea + parse-result feedback).
 * Variant-specific chip formatting per design C.1.
 *
 * wires the cx-kit autocomplete
 * helpers (`filterAutocompleteItems` + `computeMatchSpans`) into the
 * advanced-filter textarea as a column-name typeahead popover.
 * Triggered on input when the word-at-cursor is non-empty AND not
 * inside a string literal. Suggestion source is `props.columns`
 * (`{ colId, label }` per column). Keyboard: ArrowUp/Down walks the
 * list (focus stays on textarea), Enter or Tab commits, Escape
 * dismisses. On commit: replace word-at-cursor with `col.id`. See
 * `audit/TABLE_PHASE_100_2_ADVANCED_FILTER_TYPEAHEAD_DESIGN.md`.
 */
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
} from 'vue';

import {
  computeMatchSpans,
  filterAutocompleteItems,
  type AutocompleteMatch,
} from '@chronixjs/cx-kit';
import {
  collectUniqueColumnValues,
  createLocalStorageRecentStorage,
  createMemoryRecentStorage,
  DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX,
  type CollectUniqueColumnValuesResult,
  type ColumnSpec,
  type ColumnUniqueValue,
  type FilterSpec,
  type ParseFilterExpressionError,
  type RowSpec,
  type TypeaheadRecentStorage,
} from '@chronixjs/table';

import type { TableHandle } from './chronix-table.js';

export interface ChronixFiltersToolPanelProps {
  readonly tableHandle: TableHandle | null;
  readonly columns: readonly ColumnSpec[];
  readonly filterSpec: readonly FilterSpec[];
  /**
   * row population to source unique
   * values from for the advanced-filter typeahead value slot. When
   * undefined OR empty, the value slot stays empty (popover
   * suppressed for value typing — same as behavior).
   * When set, the panel calls `collectUniqueColumnValues` per column
   * (cached) to populate value suggestions.
   */
  readonly advancedFilterValueSourceRows?: readonly RowSpec[];
  /**
   * formatter for date-typed value
   * suggestions in the advanced-filter typeahead. When set + column
   * type is `'date'`, formatter is called with the ISO string for the
   * popover display label. The inserted DSL text remains the raw
   * ISO-quoted string (parser-correct).
   */
  readonly formatTypeaheadDateValue?: (iso: string) => string;
  /**
   * consumer-supplied operator override
   * dictionary for custom column types (or built-in type override).
   * Spread-merged on top of `OPERATORS_BY_COLUMN_TYPE` — consumer keys
   * win on collision; new keys are added.
   */
  readonly operatorsByCustomColumnType?: Readonly<Record<string, readonly string[]>>;
  /**
   * consumer-supplied localized label
   * dictionary for the advanced-filter operator typeahead. Maps DSL
   * key (`>=`, `contains`, etc.) to display label. Inserted text
   * remains the DSL key (parser-correct).
   */
  readonly operatorLabels?: Readonly<Record<string, string>>;
  /**
   * cap on per-slot-kind recent
   * typeahead-selection rings. Default 5; clamped to [0, 20]. Pass 0
   * to disable the recent feature entirely (no ring populated, no
   * recent badge rendered).
   */
  readonly typeaheadRecentLimit?: number;
  /**
   * consumer-supplied async value
   * getter for the value-slot typeahead. When set, used in preference
   * over `advancedFilterValueSourceRows` (getter wins per Decision
   * R.1). Receives `(colId, query)` and resolves to the unique-value
   * list for that column + query. Internal cache by `colId::query`;
   * stale-request races discarded via per-key request-id token.
   */
  readonly advancedFilterValueGetter?: (
    colId: string,
    query: string,
    /**
     * optional `AbortSignal` passed through
     * to consumer-controlled `fetch` calls. When a new request fires
     * for the same `${colId}::${query}` key (rapid typing), the prior
     * request's controller is aborted before the new one fires.
     * Backwards-compat: existing 2-arg consumers ignore the third
     * arg and keep working; race-discard token logic stays in place
     * as defense-in-depth.
     */
    signal?: AbortSignal,
  ) => Promise<readonly ColumnUniqueValue[]>;
  /**
   * persistence backend selector for the
   * typeahead recent rings . Default `'memory'`
   * preserves the original chronix-first NO-storage precedent.
   * `'localStorage'` activates opt-in `window.localStorage`
   * persistence keyed by `cx-table-typeahead-recent::${slot}`.
   * Storage errors (SSR, private-mode, quota) are swallowed
   * silently — recent rings are non-critical UX state.
   */
  readonly typeaheadRecentStorage?: 'memory' | 'localStorage';
  /**
   * scope of the typeahead recent rings.
   * Default `'global'` preserves O.1 behavior — one
   * ring per slot kind, shared across all columns. `'per-column-value'`
   * keys VALUE-slot recent rings by `${slot}:${colId}` so each
   * column's value recents stay segregated from siblings. Operator /
   * keyword / column slots stay per-slot-only regardless of this
   * prop (those values are meaningful cross-column).
   */
  readonly typeaheadRecentScope?: 'global' | 'per-column-value';
}

const TEXT_OPERATOR_LABEL: Readonly<Record<string, string>> = {
  contains: '包含',
  equals: '等于',
  startsWith: '以…开头',
  endsWith: '以…结尾',
};

function getColumnLabel(colId: string, columns: readonly ColumnSpec[]): string {
  const col = columns.find((c) => c.id === colId);
  if (col == null) return colId;
  return col.headerName ?? col.id;
}

export function formatFilterChipLabel(spec: FilterSpec, columns: readonly ColumnSpec[]): string {
  if (spec.type === 'text') {
    const colLabel = getColumnLabel(spec.colId, columns);
    const opLabel = TEXT_OPERATOR_LABEL[spec.operator] ?? spec.operator;
    return `「${colLabel}」 ${opLabel} "${spec.value}"`;
  }
  if (spec.type === 'number') {
    const colLabel = getColumnLabel(spec.colId, columns);
    if (spec.operator === 'inRange') {
      const to = spec.valueTo ?? spec.value;
      return `「${colLabel}」 ∈ [${spec.value}, ${to}]`;
    }
    return `「${colLabel}」 ${spec.operator} ${spec.value}`;
  }
  if (spec.type === 'set') {
    const colLabel = getColumnLabel(spec.colId, columns);
    if (spec.selectedValues == null) {
      return `「${colLabel}」 (all)`;
    }
    if (spec.selectedValues.length === 0) {
      return `「${colLabel}」 ∈ ∅`;
    }
    const head = spec.selectedValues.slice(0, 3).map((v) => (v == null ? '(空)' : String(v)));
    const tail = spec.selectedValues.length > 3 ? `, …+${spec.selectedValues.length - 3} more` : '';
    return `「${colLabel}」 ∈ {${head.join(', ')}${tail}}`;
  }
  if (spec.type === 'multi') {
    const colLabel = getColumnLabel(spec.colId, columns);
    const active = spec.filters.filter((f) => {
      if (f.type === 'text') return f.value !== '';
      if (f.type === 'number') return Number.isFinite(f.value);
      if (f.type === 'set') return f.selectedValues != null;
      return f.filters.length > 0;
    }).length;
    const modeLabel = spec.mode === 'AND' ? '全部满足' : '任一满足';
    return `「${colLabel}」 ${modeLabel} · ${active} 个条件`;
  }
  // expression
  const source = spec.source ?? '';
  const snippet = source.length > 80 ? `${source.slice(0, 80)}…` : source;
  return `「高级筛选」: ${snippet}`;
}

/**
 * word-at-cursor extraction for the
 * advanced filter typeahead. Walks left and right from `cursorPos`
 * over non-terminator chars; terminators are whitespace + DSL
 * delimiters (`= ! > < ( ) , "`). Also detects "inside a string
 * literal" by counting unescaped `"` chars before cursor (odd =
 * inside; suppresses typeahead so users typing values aren't
 * interrupted).
 */
export function extractWordAtCursor(
  text: string,
  cursorPos: number,
): {
  readonly word: string;
  readonly start: number;
  readonly end: number;
  readonly isInsideStringLiteral: boolean;
} {
  const safePos = Math.max(0, Math.min(cursorPos, text.length));
  // Count unescaped " before cursor.
  let quoteCount = 0;
  for (let i = 0; i < safePos; i++) {
    if (text[i] === '"' && (i === 0 || text[i - 1] !== '\\')) quoteCount++;
  }
  const isInsideStringLiteral = quoteCount % 2 === 1;
  const isTerminator = (ch: string | undefined): boolean => {
    if (ch == null) return true;
    return ' \t\n\r=!><(),"'.includes(ch);
  };
  let start = safePos;
  while (start > 0 && !isTerminator(text[start - 1])) start--;
  let end = safePos;
  while (end < text.length && !isTerminator(text[end])) end++;
  return { word: text.slice(start, end), start, end, isInsideStringLiteral };
}

/**
 * 12 advanced-filter operators ratified
 * 's DSL parser. Suggested in operator-slot context.
 */
export const ADVANCED_FILTER_OPERATORS: readonly string[] = [
  '=',
  '!=',
  '>',
  '<',
  '>=',
  '<=',
  'contains',
  'startsWith',
  'endsWith',
  'in',
  'isNull',
  'isNotNull',
];

/**
 * 3 conjunction / negation keywords
 * ratified 's DSL parser. Suggested in conjunction-slot
 * context.
 */
export const ADVANCED_FILTER_KEYWORDS: readonly string[] = ['AND', 'OR', 'NOT'];

/**
 * per-column-type allowed operator subset.
 * When the prior column's `ColumnSpec.type` matches a key, the operator
 * typeahead is filtered to only the listed operators. Unknown / absent
 * type falls back to the full `ADVANCED_FILTER_OPERATORS` list
 * (backwards-compat per Decision J.1).
 */
export const OPERATORS_BY_COLUMN_TYPE: Readonly<Record<string, readonly string[]>> = {
  text: ['=', '!=', 'contains', 'startsWith', 'endsWith', 'in', 'isNull', 'isNotNull'],
  number: ['=', '!=', '>', '<', '>=', '<=', 'in', 'isNull', 'isNotNull'],
  date: ['=', '!=', '>', '<', '>=', '<=', 'isNull', 'isNotNull'],
  boolean: ['=', '!=', 'isNull', 'isNotNull'],
};

const ADVANCED_FILTER_OPERATOR_SET = new Set(ADVANCED_FILTER_OPERATORS);
const ADVANCED_FILTER_KEYWORD_SET = new Set(['AND', 'OR', 'NOT']);

/**
 * typeahead slot classification — the
 * 4 token positions where typeahead suggestions differ.
 *
 * - `'column'`: after expression-start / `(` / `,` / a conjunction
 *   keyword — column names are expected. Suggest column items.
 * - `'operator'`: after a column-name identifier — an operator is
 *   expected. Suggest 12 operators.
 * - `'value'`: after a comparison operator — a value (literal /
 *   string / numeric) is expected. v100.2.1 suppresses suggestions
 *   here (deferred for column-value collection).
 * - `'conjunction'`: after a complete comparison expression (value
 *   literal / `isNull` / `isNotNull` / closing `)`) — `AND` / `OR`
 *   / `NOT` is expected. Suggest 3 keywords.
 */
export type TypeaheadSlot = 'column' | 'operator' | 'value' | 'conjunction';

/** frozen empty array for absent-recent-ring lookups. */
const EMPTY_RECENT_RING: readonly string[] = Object.freeze([]);

/**
 * scan tokens backward from cursor to
 * classify the slot. Token-back scan (NOT full re-parse) per
 * Decision G.1. Tokenizer recognizes the same chars as
 * `extractWordAtCursor` for token boundaries; reads the IMMEDIATELY
 * PRIOR token (skipping whitespace), classifies its shape, and maps
 * to a slot per Decision G.1's classification rules.
 *
 * widened return to include `prevColumn`
 * when slot is `'value'` — walks past the comparison operator + any
 * whitespace + reads the prior identifier token (the column name).
 * Absent if the prior token isn't a recognizable identifier (e.g.
 * the operator was at the start of the expression).
 */
export function detectTypeaheadSlot(
  text: string,
  cursorPos: number,
): {
  readonly slot: TypeaheadSlot;
  readonly prevToken?: string;
  readonly prevColumn?: string;
} {
  const safePos = Math.max(0, Math.min(cursorPos, text.length));
  // Skip the word-at-cursor by walking left over non-terminator chars.
  const isTerminator = (ch: string | undefined): boolean => {
    if (ch == null) return true;
    return ' \t\n\r=!><(),"'.includes(ch);
  };
  let i = safePos;
  // First: walk past the word-at-cursor (if any).
  while (i > 0 && !isTerminator(text[i - 1])) i--;
  // Now: skip whitespace before the prior token.
  while (i > 0 && (text[i - 1] === ' ' || text[i - 1] === '\t' || text[i - 1] === '\n')) i--;
  if (i === 0) return { slot: 'column' };
  // Read the prior token. Handle each terminator-kind explicitly.
  const ch = text[i - 1];
  if (ch === '(' || ch === ',') return { slot: 'column', prevToken: ch };
  if (ch === '"') {
    // disambiguate opening vs closing
    // quote by counting unescaped `"` chars before this position.
    // Even count → encountered `"` IS opening (cursor sits inside an
    // open literal); odd count → closing (literal already closed).
    let quoteCountBefore = 0;
    for (let k = 0; k < i - 1; k++) {
      if (text[k] === '"' && (k === 0 || text[k - 1] !== '\\')) quoteCountBefore++;
    }
    if (quoteCountBefore % 2 === 0) {
      // Opening quote. Walk back to find the comparison operator (if
      // any), then the prevColumn behind that. Mirrors the existing
      // operator-slot column-resolution logic at lines 297-313 and
      // 332-348 but threaded through the opening-quote boundary.
      let j = i - 1; // position of the opening "
      while (j > 0 && (text[j - 1] === ' ' || text[j - 1] === '\t' || text[j - 1] === '\n')) j--;
      if (j === 0) return { slot: 'value', prevToken: '"' };
      let opStart = j;
      const cBefore = text[opStart - 1];
      if (cBefore === '=' || cBefore === '>' || cBefore === '<' || cBefore === '!') {
        while (
          opStart > 0 &&
          (text[opStart - 1] === '=' ||
            text[opStart - 1] === '>' ||
            text[opStart - 1] === '<' ||
            text[opStart - 1] === '!')
        )
          opStart--;
      } else if (cBefore != null && !isTerminator(cBefore)) {
        // Word-operator candidate (e.g. `contains`).
        while (opStart > 0 && !isTerminator(text[opStart - 1])) opStart--;
      } else {
        // Unrecognized terminator before " — not a value-slot context.
        return { slot: 'value', prevToken: '"' };
      }
      const opText = text.slice(opStart, j);
      if (!ADVANCED_FILTER_OPERATOR_SET.has(opText)) {
        return { slot: 'value', prevToken: '"' };
      }
      let colJ = opStart;
      while (
        colJ > 0 &&
        (text[colJ - 1] === ' ' || text[colJ - 1] === '\t' || text[colJ - 1] === '\n')
      )
        colJ--;
      const colEnd = colJ;
      let colStart = colJ;
      while (colStart > 0 && !isTerminator(text[colStart - 1])) colStart--;
      const colCandidate = text.slice(colStart, colEnd);
      const prevColumn =
        colCandidate !== '' &&
        !ADVANCED_FILTER_KEYWORD_SET.has(colCandidate.toUpperCase()) &&
        !ADVANCED_FILTER_OPERATOR_SET.has(colCandidate) &&
        !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(colCandidate)
          ? colCandidate
          : undefined;
      return prevColumn != null
        ? { slot: 'value', prevToken: '"', prevColumn }
        : { slot: 'value', prevToken: '"' };
    }
    // Closing quote — comparison complete → conjunction slot.
    return { slot: 'conjunction', prevToken: '"' };
  }
  if (ch === ')') {
    return { slot: 'conjunction', prevToken: ')' };
  }
  // Operator chars `=`, `>`, `<`, `!` and their combinations like
  // `>=`, `<=`, `!=`. Walk back through these chars to capture the
  // full operator token.
  if (ch === '=' || ch === '>' || ch === '<' || ch === '!') {
    const opEnd = i;
    let opStart = i;
    while (
      opStart > 0 &&
      (text[opStart - 1] === '=' ||
        text[opStart - 1] === '>' ||
        text[opStart - 1] === '<' ||
        text[opStart - 1] === '!')
    ) {
      opStart--;
    }
    const opText = text.slice(opStart, opEnd);
    // also walk past the operator + whitespace
    // to read the prior identifier (column name) for value-slot value
    // suggestion source resolution.
    let j = opStart;
    while (j > 0 && (text[j - 1] === ' ' || text[j - 1] === '\t' || text[j - 1] === '\n')) j--;
    const colEnd = j;
    let colStart = j;
    while (colStart > 0 && !isTerminator(text[colStart - 1])) colStart--;
    const colCandidate = text.slice(colStart, colEnd);
    const prevColumn =
      colCandidate !== '' &&
      !ADVANCED_FILTER_KEYWORD_SET.has(colCandidate.toUpperCase()) &&
      !ADVANCED_FILTER_OPERATOR_SET.has(colCandidate) &&
      !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(colCandidate)
        ? colCandidate
        : undefined;
    return prevColumn != null
      ? { slot: 'value', prevToken: opText, prevColumn }
      : { slot: 'value', prevToken: opText };
  }
  // It's an identifier / word char. Read it left.
  const end = i;
  let start = i;
  while (start > 0 && !isTerminator(text[start - 1])) start--;
  const tokenText = text.slice(start, end);
  // Classify the token.
  if (ADVANCED_FILTER_KEYWORD_SET.has(tokenText.toUpperCase())) {
    return { slot: 'column', prevToken: tokenText };
  }
  if (ADVANCED_FILTER_OPERATOR_SET.has(tokenText)) {
    // Recognized operator name (`contains`, `startsWith`, `in`, etc.)
    // `isNull` / `isNotNull` take no value — those are "complete-
    // comparison" markers, so they map to conjunction slot.
    if (tokenText === 'isNull' || tokenText === 'isNotNull') {
      return { slot: 'conjunction', prevToken: tokenText };
    }
    // also walk past the word-op + whitespace
    // to read the prior identifier (column name) for value-slot resolution.
    let j = start;
    while (j > 0 && (text[j - 1] === ' ' || text[j - 1] === '\t' || text[j - 1] === '\n')) j--;
    const colEnd = j;
    let colStart = j;
    while (colStart > 0 && !isTerminator(text[colStart - 1])) colStart--;
    const colCandidate = text.slice(colStart, colEnd);
    const prevColumn =
      colCandidate !== '' &&
      !ADVANCED_FILTER_KEYWORD_SET.has(colCandidate.toUpperCase()) &&
      !ADVANCED_FILTER_OPERATOR_SET.has(colCandidate) &&
      !/^[+-]?(\d+\.?\d*|\.\d+)$/.test(colCandidate)
        ? colCandidate
        : undefined;
    return prevColumn != null
      ? { slot: 'value', prevToken: tokenText, prevColumn }
      : { slot: 'value', prevToken: tokenText };
  }
  // Numeric literal → conjunction slot (comparison complete).
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(tokenText)) {
    return { slot: 'conjunction', prevToken: tokenText };
  }
  // Identifier — assume column name → operator slot.
  return { slot: 'operator', prevToken: tokenText };
}

/**
 * discriminated-union typeahead item
 * shape. The `kind` discriminator drives both the suggestion source
 * (per detected slot) and the commit logic (insert `colId` for
 * column items vs `text` for operator/keyword items).
 */
export type TypeaheadItem =
  | {
      readonly kind: 'column';
      readonly colId: string;
      readonly label: string;
      readonly recent?: boolean;
    }
  | {
      readonly kind: 'operator';
      readonly text: string;
      readonly displayText?: string;
      readonly recent?: boolean;
    }
  | { readonly kind: 'keyword'; readonly text: string; readonly recent?: boolean }
  | {
      readonly kind: 'value';
      readonly text: string;
      readonly valueKind: 'string' | 'number' | 'boolean' | 'null';
      readonly count?: number;
      readonly displayText?: string;
      readonly recent?: boolean;
    };

/**
 * format a raw column value as its DSL
 * representation. Strings are wrapped in double quotes (with embedded
 * `"` backslash-escaped per grammar); numbers / booleans /
 * null are emitted bare.
 */
export function formatValueAsDsl(value: string | number | boolean | null): {
  readonly text: string;
  readonly valueKind: 'string' | 'number' | 'boolean' | 'null';
} {
  if (value === null) return { text: 'null', valueKind: 'null' };
  if (typeof value === 'number') return { text: String(value), valueKind: 'number' };
  if (typeof value === 'boolean') return { text: String(value), valueKind: 'boolean' };
  // string — quote + backslash-escape embedded double quotes.
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return { text: `"${escaped}"`, valueKind: 'string' };
}

export const ChronixFiltersToolPanel = defineComponent({
  name: 'ChronixFiltersToolPanel',
  props: {
    tableHandle: {
      type: Object as PropType<TableHandle | null>,
      default: null,
    },
    columns: {
      type: Array as PropType<readonly ColumnSpec[]>,
      required: true,
    },
    filterSpec: {
      type: Array as PropType<readonly FilterSpec[]>,
      required: true,
    },
    advancedFilterValueSourceRows: {
      type: Array as PropType<readonly RowSpec[]>,
      default: undefined,
    },
    formatTypeaheadDateValue: {
      type: Function as PropType<((iso: string) => string) | undefined>,
      default: undefined,
    },
    operatorsByCustomColumnType: {
      type: Object as PropType<Readonly<Record<string, readonly string[]>> | undefined>,
      default: undefined,
    },
    operatorLabels: {
      type: Object as PropType<Readonly<Record<string, string>> | undefined>,
      default: undefined,
    },
    typeaheadRecentLimit: {
      type: Number,
      default: 5,
    },
    advancedFilterValueGetter: {
      type: Function as PropType<
        | ((
            colId: string,
            query: string,
            signal?: AbortSignal,
          ) => Promise<readonly ColumnUniqueValue[]>)
        | undefined
      >,
      default: undefined,
    },
    typeaheadRecentStorage: {
      type: String as PropType<'memory' | 'localStorage'>,
      default: 'memory',
    },
    typeaheadRecentScope: {
      type: String as PropType<'global' | 'per-column-value'>,
      default: 'global',
    },
  },
  setup(props) {
    const advancedFilterText = ref('');
    const parseErrors = ref<readonly ParseFilterExpressionError[]>([]);

    // typeahead state. `typeaheadOpen` controls popover
    // mount; `typeaheadActiveIdx` is the highlighted suggestion (-1
    // = none); `typeaheadQuery` is the extracted word-at-cursor;
    // `typeaheadWordRange` is the char range of the word in textarea
    // content (for replace-on-commit).
    const typeaheadOpen = ref<boolean>(false);
    const typeaheadActiveIdx = ref<number>(-1);
    const typeaheadAnchorRect = ref<DOMRect | null>(null);
    const typeaheadQuery = ref<string>('');
    const typeaheadWordRange = ref<{ start: number; end: number } | null>(null);
    const textareaRef = ref<HTMLTextAreaElement | null>(null);
    const typeaheadPopoverRef = ref<HTMLElement | null>(null);

    const chips = computed(() =>
      props.filterSpec.map((spec, index) => ({
        index,
        spec,
        label: formatFilterChipLabel(spec, props.columns),
      })),
    );

    // typeahead slot state — drives the
    // suggestion source per detected token-back context.
    // (2026-06-01): widened from a single `TypeaheadSlot` ref to the
    // full `detectTypeaheadSlot` result so the `typeaheadMatches`
    // computed can read `prevToken` (column id for operator slot type
    // filtering).
    const typeaheadSlotDetected = ref<{
      readonly slot: TypeaheadSlot;
      readonly prevToken?: string;
      readonly prevColumn?: string;
    }>({ slot: 'column' });

    // per-colId cache of unique-value
    // collection results. Cleared whenever
    // `props.advancedFilterValueSourceRows` reference changes (entire
    // cache invalidation per Decision H.1 — avoids per-row equality
    // checking).
    const valueSourceCacheByColId = ref<Map<string, CollectUniqueColumnValuesResult>>(new Map());
    watch(
      () => props.advancedFilterValueSourceRows,
      () => {
        valueSourceCacheByColId.value = new Map();
      },
    );

    // tracks whether cursor sits inside
    // an open string literal in a value-slot context. Set in
    // `triggerTypeaheadAt`; read by `typeaheadMatches` (filter to
    // string-kind values) + `commitTypeaheadSelection` (insert text
    // is bare-value + closing `"`).
    const typeaheadInsideStringLiteral = ref<boolean>(false);

    // per-slot-kind LRU rings for recent
    // typeahead selections. Push on commit; render-overlay in
    // `typeaheadMatches`. In-memory only by default (chronix-first
    // NO-storage precedent per K.1).
    //
    // when `typeaheadRecentStorage` is set to
    // `'localStorage'`, hydrate on mount + write-through on commit
    // via `createLocalStorageRecentStorage`. Default `'memory'`
    // preserves zero-storage behavior.
    // keys widened from `TypeaheadSlot` to
    // `string` so per-column scope can use `${slot}:${colId}` keys.
    // When `typeaheadRecentScope === 'global'`, keys remain the
    // plain slot literals (backwards-compat).
    const recentTypeaheadByKind = ref<Map<string, readonly string[]>>(new Map());
    const effectiveTypeaheadRecentLimit = computed(() =>
      Math.max(0, Math.min(20, props.typeaheadRecentLimit ?? 5)),
    );
    const typeaheadRecentStorage = computed<TypeaheadRecentStorage>(() =>
      props.typeaheadRecentStorage === 'localStorage'
        ? createLocalStorageRecentStorage(DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX)
        : createMemoryRecentStorage(),
    );
    onMounted(() => {
      // hydrate recent rings from the configured storage
      // backend on mount. Memory backend returns empty rings (no-op).
      const storage = typeaheadRecentStorage.value;
      const slots: readonly TypeaheadSlot[] = ['column', 'operator', 'value', 'conjunction'];
      const hydrated = new Map<TypeaheadSlot, readonly string[]>();
      for (const slot of slots) {
        const ring = storage.read(slot);
        if (ring.length > 0) hydrated.set(slot, ring);
      }
      if (hydrated.size > 0) recentTypeaheadByKind.value = hydrated;
    });
    /**
     * compute the recent-ring key for a
     * given slot. When `typeaheadRecentScope === 'per-column-value'`
     * AND slot is `'value'` AND a non-null `colId` is supplied, the
     * key widens to `${slot}:${colId}` — each column's value recents
     * are segregated. Otherwise keys stay per-slot-only (Phase
     * 100.2.5 O.1 behavior). Operator / keyword / column slots are
     * always per-slot-only (they're meaningful cross-column).
     */
    function recentKey(slot: TypeaheadSlot, colId?: string | null): string {
      if (
        props.typeaheadRecentScope === 'per-column-value' &&
        slot === 'value' &&
        colId != null &&
        colId !== ''
      ) {
        return `${slot}:${colId}`;
      }
      return slot;
    }
    function pushToRecent(slot: TypeaheadSlot, text: string, colId?: string | null): void {
      const limit = effectiveTypeaheadRecentLimit.value;
      if (limit === 0) return;
      const key = recentKey(slot, colId);
      const existing = recentTypeaheadByKind.value.get(key) ?? [];
      const filtered = existing.filter((t) => t !== text);
      const next = [text, ...filtered].slice(0, limit);
      const newMap = new Map(recentTypeaheadByKind.value);
      newMap.set(key, next);
      recentTypeaheadByKind.value = newMap;
      // write-through to the configured storage backend.
      // storage key uses the same per-column suffix when
      // applicable (localStorage rehydration on-demand via readRecent).
      typeaheadRecentStorage.value.write(key, next);
    }
    /**
     * read the recent ring for a slot,
     * lazily hydrating from the storage backend when an entry is
     * absent from the in-memory map (covers per-column rings that
     * weren't hydrated at onMounted).
     */
    function readRecent(slot: TypeaheadSlot, colId?: string | null): readonly string[] {
      const key = recentKey(slot, colId);
      const cached = recentTypeaheadByKind.value.get(key);
      if (cached != null) return cached;
      const ring = typeaheadRecentStorage.value.read(key);
      if (ring.length === 0) return EMPTY_RECENT_RING;
      const newMap = new Map(recentTypeaheadByKind.value);
      newMap.set(key, ring);
      recentTypeaheadByKind.value = newMap;
      return ring;
    }

    // SSR async value getter cache +
    // request-id race-token. Key `${colId}::${query}`. Stored as
    // sentinel `'loading'` / `'error'` strings; resolved arrays
    // populate on getter-promise settle (only if request-id matches).
    const asyncValueResultsByKey = ref<
      Map<string, readonly ColumnUniqueValue[] | 'loading' | 'error'>
    >(new Map());
    const asyncRequestIdByKey = ref<Map<string, number>>(new Map());
    let nextAsyncRequestId = 1;
    // per-key AbortController. On supersession
    // (new request for same key), abort the prior controller before
    // allocating a new one. The race-discard token check (Phase
    // 100.2.2.1 T.1) stays in place as defense-in-depth for consumers
    // that ignore the signal arg.
    const asyncAbortControllerByKey = new Map<string, AbortController>();
    function abortAllAsyncControllers(): void {
      for (const controller of asyncAbortControllerByKey.values()) {
        try {
          controller.abort();
        } catch {
          // Abort throws on already-aborted in some shims; ignore.
        }
      }
      asyncAbortControllerByKey.clear();
    }
    watch(
      () => props.advancedFilterValueGetter,
      () => {
        asyncValueResultsByKey.value = new Map();
        asyncRequestIdByKey.value = new Map();
        abortAllAsyncControllers();
      },
    );
    function fetchAsyncValues(colId: string, query: string): void {
      const getter = props.advancedFilterValueGetter;
      if (getter == null) return;
      const key = `${colId}::${query}`;
      const cached = asyncValueResultsByKey.value.get(key);
      if (cached != null) return; // hit or in-flight
      const requestId = nextAsyncRequestId++;
      const newRequestMap = new Map(asyncRequestIdByKey.value);
      newRequestMap.set(key, requestId);
      asyncRequestIdByKey.value = newRequestMap;
      const newResultMap = new Map(asyncValueResultsByKey.value);
      newResultMap.set(key, 'loading');
      asyncValueResultsByKey.value = newResultMap;
      // abort prior in-flight controller for this key
      // (supersession); allocate a fresh one for the new request.
      const prior = asyncAbortControllerByKey.get(key);
      if (prior != null) {
        try {
          prior.abort();
        } catch {
          // ignore
        }
      }
      const controller = new AbortController();
      asyncAbortControllerByKey.set(key, controller);
      void getter(colId, query, controller.signal).then(
        (results) => {
          if (asyncRequestIdByKey.value.get(key) !== requestId) return;
          asyncAbortControllerByKey.delete(key);
          const next = new Map(asyncValueResultsByKey.value);
          next.set(key, results);
          asyncValueResultsByKey.value = next;
        },
        () => {
          if (asyncRequestIdByKey.value.get(key) !== requestId) return;
          asyncAbortControllerByKey.delete(key);
          const next = new Map(asyncValueResultsByKey.value);
          next.set(key, 'error');
          asyncValueResultsByKey.value = next;
        },
      );
    }

    const typeaheadMatches = computed<readonly AutocompleteMatch<TypeaheadItem>[]>(() => {
      if (!typeaheadOpen.value) return [];
      // gate item source on detected slot. Value slot
      // suppresses (returns empty array — popover render condition
      // already handles empty matches).
      const detected = typeaheadSlotDetected.value;
      let items: TypeaheadItem[];
      if (detected.slot === 'column') {
        items = props.columns.map((c) => ({
          kind: 'column' as const,
          colId: c.id,
          label: c.headerName ?? c.id,
        }));
      } else if (detected.slot === 'operator') {
        // filter operator list by the
        // prior column's `type` when known. The `prevToken` returned
        // by `detectTypeaheadSlot` for operator slot IS the column
        // identifier (per detector logic).
        // spread-merge consumer-provided
        // dict on top — consumer wins on key collision (Decision E.1).
        // resolve consumer-provided
        // localized label per operator at item-mapping time (Decision
        // G.1 + H.1).
        const colId = detected.prevToken;
        const column = colId != null ? props.columns.find((c) => c.id === colId) : undefined;
        const mergedOperatorsByType = {
          ...OPERATORS_BY_COLUMN_TYPE,
          ...(props.operatorsByCustomColumnType ?? {}),
        };
        const allowed =
          column?.type != null && column.type in mergedOperatorsByType
            ? mergedOperatorsByType[column.type]!
            : ADVANCED_FILTER_OPERATORS;
        items = allowed.map((op) => {
          const labelOverride = props.operatorLabels?.[op];
          return labelOverride != null
            ? { kind: 'operator' as const, text: op, displayText: labelOverride }
            : { kind: 'operator' as const, text: op };
        });
      } else if (detected.slot === 'conjunction') {
        items = ADVANCED_FILTER_KEYWORDS.map((kw) => ({
          kind: 'keyword' as const,
          text: kw,
        }));
      } else {
        // value slot pipeline.
        // when `advancedFilterValueGetter`
        // is set, use async branch (getter wins over rows per Decision
        // R.1). Otherwise fall back to existing sync-rows path.
        const colId = detected.prevColumn;
        if (colId == null) return [];
        const column = props.columns.find((c) => c.id === colId);
        if (column == null) return [];
        let valueSourceList: readonly ColumnUniqueValue[];
        if (props.advancedFilterValueGetter != null) {
          const asyncKey = `${colId}::${typeaheadQuery.value}`;
          const cachedAsync = asyncValueResultsByKey.value.get(asyncKey);
          if (cachedAsync == null || cachedAsync === 'loading' || cachedAsync === 'error') {
            // Loading / error / not-fetched-yet — return empty items;
            // popover renders a placeholder `<li>` separately (see
            // render path).
            return [];
          }
          valueSourceList = cachedAsync;
        } else {
          const sourceRows = props.advancedFilterValueSourceRows;
          if (sourceRows == null || sourceRows.length === 0) return [];
          let cached = valueSourceCacheByColId.value.get(colId);
          if (cached == null) {
            cached = collectUniqueColumnValues({
              rows: sourceRows,
              column,
              maxValues: 100,
            });
            valueSourceCacheByColId.value.set(colId, cached);
          }
          valueSourceList = cached.values;
        }
        // when cursor is inside an open
        // string literal, filter to string-kind values only (number /
        // boolean / null are not legal inside `"..."` per
        // grammar).
        const filteredValueList = typeaheadInsideStringLiteral.value
          ? valueSourceList.filter((v) => typeof v.value === 'string')
          : valueSourceList;
        items = filteredValueList.map((v) => {
          const formatted = formatValueAsDsl(v.value);
          // resolve consumer-supplied date
          // formatter (Decision C.1 + D.1) at item-mapping time. Strip the
          // surrounding quotes that `formatValueAsDsl` added before passing
          // to the formatter (consumer expects bare ISO); re-wrap output.
          let displayText: string | undefined;
          if (
            column.type === 'date' &&
            props.formatTypeaheadDateValue != null &&
            formatted.valueKind === 'string'
          ) {
            const isoBare = formatted.text.slice(1, -1);
            displayText = `"${props.formatTypeaheadDateValue(isoBare)}"`;
          }
          // pass through `v.count` to the
          // popover for the histogram badge (Decision A.1 + B.1).
          return displayText != null
            ? {
                kind: 'value' as const,
                text: formatted.text,
                valueKind: formatted.valueKind,
                count: v.count,
                displayText,
              }
            : {
                kind: 'value' as const,
                text: formatted.text,
                valueKind: formatted.valueKind,
                count: v.count,
              };
        });
      }
      // prepend per-slot recent items
      // marked `recent: true` (Decision O.1). Dedup: items whose key
      // matches a recent entry are removed from the non-recent
      // section so the same item doesn't appear twice.
      // when `typeaheadRecentScope` is
      // `'per-column-value'` AND we're in the value slot, route the
      // ring lookup through `readRecent` with the column-context
      // colId (= detected.prevToken for the value slot).
      const recentColId =
        detected.slot === 'value' && typeof detected.prevToken === 'string'
          ? detected.prevToken
          : null;
      const recentTexts = readRecent(detected.slot, recentColId);
      const itemKeyOf = (item: TypeaheadItem): string =>
        item.kind === 'column' ? item.colId : item.text;
      const recentTextSet = new Set(recentTexts);
      const recentItems: TypeaheadItem[] = recentTexts
        .map((text) => items.find((it) => itemKeyOf(it) === text))
        .filter((it): it is TypeaheadItem => it != null)
        .map((it): TypeaheadItem => {
          if (it.kind === 'column') return { ...it, recent: true };
          if (it.kind === 'operator') return { ...it, recent: true };
          if (it.kind === 'keyword') return { ...it, recent: true };
          return { ...it, recent: true };
        });
      const nonRecentItems = items.filter((it) => !recentTextSet.has(itemKeyOf(it)));
      const itemsWithRecent = [...recentItems, ...nonRecentItems];
      // `getText` discriminates on `kind`: column items match both
      // colId + label (per 100.2-fr4 bilingual UX); operator /
      // keyword items match against their literal text.
      return filterAutocompleteItems<TypeaheadItem>({
        items: itemsWithRecent,
        query: typeaheadQuery.value,
        getText: (i) => (i.kind === 'column' ? `${i.colId} ${i.label}` : i.text),
      });
    });

    // render placeholder state for the
    // async value getter — `'loading'` shows "加载中…", `'error'`
    // shows "加载失败". Returns null when not in async-loading-error
    // context (popover renders matches as normal).
    const asyncPlaceholderState = computed<'loading' | 'error' | null>(() => {
      if (!typeaheadOpen.value) return null;
      const detected = typeaheadSlotDetected.value;
      if (detected.slot !== 'value' || detected.prevColumn == null) return null;
      if (props.advancedFilterValueGetter == null) return null;
      const key = `${detected.prevColumn}::${typeaheadQuery.value}`;
      const cached = asyncValueResultsByKey.value.get(key);
      if (cached === 'loading') return 'loading';
      if (cached === 'error') return 'error';
      return null;
    });

    function removeFilterAt(index: number): void {
      const handle = props.tableHandle;
      if (handle == null) return;
      const spec = props.filterSpec[index];
      if (spec?.type === 'expression') {
        handle.setAdvancedFilter(null);
        return;
      }
      const next = props.filterSpec.filter((_, i) => i !== index);
      handle.setFilter(next);
    }

    function clearAll(): void {
      const handle = props.tableHandle;
      if (handle == null) return;
      handle.clearFilter();
      handle.setAdvancedFilter(null);
    }

    function applyAdvancedFilter(): void {
      const handle = props.tableHandle;
      if (handle == null) return;
      const text = advancedFilterText.value;
      const result = handle.parseAndSetAdvancedFilter(text);
      parseErrors.value = result.ok ? [] : result.errors;
    }

    function refreshTypeaheadAnchor(): void {
      const ta = textareaRef.value;
      if (ta == null) return;
      typeaheadAnchorRect.value = ta.getBoundingClientRect();
    }

    function closeTypeahead(): void {
      typeaheadOpen.value = false;
      typeaheadActiveIdx.value = -1;
      typeaheadQuery.value = '';
      typeaheadWordRange.value = null;
      typeaheadInsideStringLiteral.value = false;
    }

    // extracted from `onTextareaInput` so
    // the post-commit auto-trigger path (in `commitTypeaheadSelection`)
    // can re-run typeahead detection at the post-insertion cursor
    // without synthesizing a fake Event (Decision J.1). When called
    // from the post-commit path with `allowEmptyWord = true`, the
    // empty-word check is bypassed so the next-slot popover opens
    // even though the cursor sits just past a trailing space (no word
    // typed yet).
    function triggerTypeaheadAt(value: string, cursorPos: number, allowEmptyWord = false): void {
      advancedFilterText.value = value;
      const extracted = extractWordAtCursor(value, cursorPos);
      const detected = detectTypeaheadSlot(value, cursorPos);
      // allow typeahead when cursor sits
      // inside an open string literal IF detected slot is 'value' AND
      // prevColumn resolved. Other slots in literal context still close.
      if (extracted.isInsideStringLiteral) {
        if (detected.slot !== 'value' || detected.prevColumn == null) {
          closeTypeahead();
          return;
        }
        // Fall through; mark string-literal context so `typeaheadMatches`
        // filters to string-kind values + `commitTypeaheadSelection`
        // inserts bare-value + closing `"`.
      } else if (extracted.word === '' && !allowEmptyWord) {
        closeTypeahead();
        return;
      }
      // detect slot before opening. Value
      // slot opens IF there's a prevColumn id resolved AND
      // `advancedFilterValueSourceRows` is non-empty (the
      // `typeaheadMatches` computed will return an empty array if
      // either is missing, which suppresses popover via the existing
      // `matches.length > 0` render condition).
      typeaheadSlotDetected.value = detected;
      typeaheadInsideStringLiteral.value = extracted.isInsideStringLiteral;
      typeaheadQuery.value = extracted.word;
      typeaheadWordRange.value = { start: extracted.start, end: extracted.end };
      typeaheadOpen.value = true;
      refreshTypeaheadAnchor();
      // fire async value getter when set
      // + value slot + prevColumn resolved. Cache key is `colId::query`;
      // race-token discards stale resolves.
      if (
        detected.slot === 'value' &&
        detected.prevColumn != null &&
        props.advancedFilterValueGetter != null
      ) {
        fetchAsyncValues(detected.prevColumn, extracted.word);
      }
      typeaheadActiveIdx.value = typeaheadMatches.value.length > 0 ? 0 : -1;
    }

    function onTextareaInput(e: Event): void {
      const ta = e.target as HTMLTextAreaElement;
      const cursorPos = ta.selectionStart ?? ta.value.length;
      triggerTypeaheadAt(ta.value, cursorPos);
    }

    function commitTypeaheadSelection(): void {
      const matches = typeaheadMatches.value;
      const idx = typeaheadActiveIdx.value;
      const wordRange = typeaheadWordRange.value;
      if (idx < 0 || idx >= matches.length || wordRange == null) return;
      const active = matches[idx];
      if (active == null) return;
      const text = advancedFilterText.value;
      // + column items insert `colId`;
      // operator / keyword / value items insert their literal text
      // (value items are pre-formatted as DSL — strings quoted,
      // numbers/booleans/null bare).
      // when committing a value-kind item
      // INSIDE an open string literal context, insert bare-value +
      // closing `"` (consumer already typed the opening quote; the
      // wordRange is the bare-query range between opening `"` and
      // cursor).
      let insertText: string;
      if (
        active.item.kind === 'value' &&
        typeaheadInsideStringLiteral.value &&
        active.item.valueKind === 'string'
      ) {
        // formatted.text is `"in-progress"`; strip leading " (consumer
        // typed it); keep trailing " as the closing quote.
        insertText = active.item.text.slice(1);
      } else {
        insertText = active.item.kind === 'column' ? active.item.colId : active.item.text;
      }
      const nextText = text.slice(0, wordRange.start) + insertText + text.slice(wordRange.end);
      const newCursorPos = wordRange.start + insertText.length;
      // for column / operator / keyword
      // commits, append a trailing space + re-trigger typeahead at the
      // new cursor (Decision I.1 — value-kind commits skip; appending
      // space after a value would cause parse errors).
      const shouldAutoTrigger = active.item.kind !== 'value';
      const finalText = shouldAutoTrigger
        ? nextText.slice(0, newCursorPos) + ' ' + nextText.slice(newCursorPos)
        : nextText;
      const finalCursorPos = shouldAutoTrigger ? newCursorPos + 1 : newCursorPos;
      // push to per-slot recent ring
      // BEFORE close/autotrigger (Decision P.1 — commit lifecycle is
      // the single point where user-intent crystallizes).
      // scope push by colId for value slots
      // when `typeaheadRecentScope === 'per-column-value'`.
      const slot = typeaheadSlotDetected.value.slot;
      const pushText = active.item.kind === 'column' ? active.item.colId : active.item.text;
      const pushColId =
        slot === 'value' && typeof typeaheadSlotDetected.value.prevToken === 'string'
          ? typeaheadSlotDetected.value.prevToken
          : null;
      pushToRecent(slot, pushText, pushColId);
      advancedFilterText.value = finalText;
      const ta = textareaRef.value;
      if (ta != null) {
        ta.value = finalText;
        void Promise.resolve().then(() => {
          ta.setSelectionRange(finalCursorPos, finalCursorPos);
          ta.focus();
        });
      }
      if (shouldAutoTrigger) {
        triggerTypeaheadAt(finalText, finalCursorPos, true);
      } else {
        closeTypeahead();
      }
    }

    function onTextareaKeydown(e: KeyboardEvent): void {
      if (!typeaheadOpen.value) return;
      const matches = typeaheadMatches.value;
      if (matches.length === 0) {
        if (e.key === 'Escape') closeTypeahead();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        typeaheadActiveIdx.value = (typeaheadActiveIdx.value + 1) % matches.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        typeaheadActiveIdx.value =
          typeaheadActiveIdx.value <= 0 ? matches.length - 1 : typeaheadActiveIdx.value - 1;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (typeaheadActiveIdx.value < 0) return;
        e.preventDefault();
        commitTypeaheadSelection();
      } else if (e.key === 'Escape') {
        closeTypeahead();
      }
    }

    function onDocumentPointerDown(e: PointerEvent): void {
      if (!typeaheadOpen.value) return;
      const target = e.target as Node | null;
      const ta = textareaRef.value;
      const pop = typeaheadPopoverRef.value;
      if (ta != null && target != null && ta.contains(target)) return;
      if (pop != null && target != null && pop.contains(target)) return;
      closeTypeahead();
    }

    onMounted(() => {
      document.addEventListener('pointerdown', onDocumentPointerDown);
    });
    onBeforeUnmount(() => {
      document.removeEventListener('pointerdown', onDocumentPointerDown);
    });

    // scroll the active typeahead item into
    // view after arrow-key navigation moves `typeaheadActiveIdx` past
    // the visible window of the 240px-max-height scrollable popover.
    // `flush: 'post'` ensures the DOM reflects the new active class
    // before we resolve the element (Decision L.1).
    watch(
      typeaheadActiveIdx,
      (idx) => {
        if (idx < 0) return;
        const listbox = typeaheadPopoverRef.value;
        if (listbox == null) return;
        const activeEl = listbox.querySelector<HTMLElement>(`[data-typeahead-item-index="${idx}"]`);
        if (activeEl == null) return;
        // Defensive guard: skip when scrollIntoView is unavailable
        // (e.g. jsdom test env doesn't ship it).
        if (typeof activeEl.scrollIntoView !== 'function') return;
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      },
      { flush: 'post' },
    );

    function renderMatchLabel(label: string, query: string): (ReturnType<typeof h> | string)[] {
      const spans = computeMatchSpans(label, query, 'substring');
      if (spans.length === 0) return [label];
      const span = spans[0]!;
      const before = label.slice(0, span.start);
      const match = label.slice(span.start, span.end);
      const after = label.slice(span.end);
      const children: (ReturnType<typeof h> | string)[] = [];
      if (before !== '') children.push(before);
      children.push(
        h(
          'span',
          {
            class: 'cx-filters-typeahead-item__match',
            style: { fontWeight: '600', backgroundColor: '#fef3c7' },
          },
          match,
        ),
      );
      if (after !== '') children.push(after);
      return children;
    }

    return () =>
      h('div', { class: 'cx-table-filters-tool-panel' }, [
        h('div', { class: 'cx-table-filters-tool-panel__header' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'cx-table-filters-tool-panel__clear-all',
              'data-testid': 'cx-filters-tool-panel-clear-all',
              onClick: clearAll,
            },
            '清除全部筛选',
          ),
        ]),
        h('div', { class: 'cx-table-filters-tool-panel__body' }, [
          h(
            'div',
            { class: 'cx-table-filters-tool-panel__chips' },
            chips.value.length === 0
              ? [h('div', { class: 'cx-table-filters-tool-panel__empty' }, '当前无筛选')]
              : chips.value.map((chip) =>
                  h(
                    'div',
                    {
                      key: chip.index,
                      class: 'cx-table-filters-tool-panel__chip',
                      'data-tool-panel-chip-index': String(chip.index),
                    },
                    [
                      h('span', { class: 'cx-table-filters-tool-panel__chip-label' }, chip.label),
                      h(
                        'button',
                        {
                          type: 'button',
                          class: 'cx-table-filters-tool-panel__chip-close',
                          'aria-label': '移除该筛选',
                          'data-testid': `cx-filters-tool-panel-chip-close-${chip.index}`,
                          onClick: () => removeFilterAt(chip.index),
                        },
                        '×',
                      ),
                    ],
                  ),
                ),
          ),
          h('div', { class: 'cx-table-filters-tool-panel__advanced' }, [
            h(
              'label',
              { class: 'cx-table-filters-tool-panel__advanced-label' },
              '高级筛选 (表达式 DSL)',
            ),
            h('textarea', {
              ref: (el: unknown) => {
                textareaRef.value = el as HTMLTextAreaElement | null;
              },
              class: 'cx-table-filters-tool-panel__textarea',
              rows: 3,
              placeholder: '如 name contains "foo" and qty > 10',
              value: advancedFilterText.value,
              'data-testid': 'cx-filters-tool-panel-advanced-textarea',
              role: 'combobox',
              'aria-autocomplete': 'list',
              'aria-expanded': typeaheadOpen.value ? 'true' : 'false',
              'aria-controls': 'cx-filters-typeahead-listbox',
              'aria-activedescendant':
                typeaheadOpen.value && typeaheadActiveIdx.value >= 0
                  ? `cx-filters-typeahead-item-${typeaheadActiveIdx.value}`
                  : undefined,
              onInput: onTextareaInput,
              onKeydown: onTextareaKeydown,
            }),
            h(
              'button',
              {
                type: 'button',
                class: 'cx-table-filters-tool-panel__apply',
                'data-testid': 'cx-filters-tool-panel-advanced-apply',
                onClick: applyAdvancedFilter,
              },
              '应用',
            ),
            parseErrors.value.length > 0
              ? h(
                  'ul',
                  {
                    class: 'cx-table-filters-tool-panel__errors',
                    'data-testid': 'cx-filters-tool-panel-errors',
                  },
                  parseErrors.value.map((err, i) => h('li', { key: i }, err.message)),
                )
              : null,
          ]),
        ]),
        // typeahead popover. Mounts only when
        // `typeaheadOpen` is true AND matches array non-empty. Fixed
        // position anchored below the textarea. Listbox semantics
        // (role="listbox" with role="option" children + the combobox
        // points at the active option via aria-activedescendant).
        // also mount popover for async
        // 'loading' / 'error' placeholder state.
        typeaheadOpen.value &&
        (typeaheadMatches.value.length > 0 || asyncPlaceholderState.value != null) &&
        typeaheadAnchorRect.value != null
          ? h(
              'ul',
              {
                ref: (el: unknown) => {
                  typeaheadPopoverRef.value = el as HTMLElement | null;
                },
                id: 'cx-filters-typeahead-listbox',
                class: 'cx-filters-typeahead',
                role: 'listbox',
                'data-testid': 'cx-filters-typeahead',
                style: {
                  position: 'fixed',
                  left: `${typeaheadAnchorRect.value.left}px`,
                  top: `${typeaheadAnchorRect.value.bottom + 4}px`,
                  width: `${Math.min(280, typeaheadAnchorRect.value.width)}px`,
                  maxHeight: '240px',
                  overflowY: 'auto',
                  margin: 0,
                  padding: '4px 0',
                  listStyle: 'none',
                  zIndex: 9,
                  background: '#ffffff',
                  border: '1px solid #d9dde2',
                  borderRadius: '4px',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.18)',
                  fontSize: '12px',
                },
              },
              asyncPlaceholderState.value != null
                ? [
                    h(
                      'li',
                      {
                        class: 'cx-filters-typeahead-placeholder',
                        'data-testid':
                          asyncPlaceholderState.value === 'loading'
                            ? 'cx-filters-typeahead-loading'
                            : 'cx-filters-typeahead-error',
                        style: {
                          padding: '6px 10px',
                          fontSize: '12px',
                          color: '#6b7280',
                          fontStyle: 'italic',
                        },
                      },
                      asyncPlaceholderState.value === 'loading' ? '加载中…' : '加载失败',
                    ),
                  ]
                : typeaheadMatches.value.map((match, idx) => {
                    const isActive = idx === typeaheadActiveIdx.value;
                    // per-kind display label + category
                    // badge. Column items show headerName label;
                    // operator / keyword items show the literal token.
                    // + 100.2.3.2 (2026-06-01): value /
                    // operator variants may carry consumer-overridden
                    // `displayText` (date formatter / localized labels);
                    // prefer it over `text` when present.
                    const displayLabel =
                      match.item.kind === 'column'
                        ? match.item.label
                        : (match.item.kind === 'value' || match.item.kind === 'operator') &&
                            match.item.displayText != null
                          ? match.item.displayText
                          : match.item.text;
                    const itemKey =
                      match.item.kind === 'column' ? match.item.colId : match.item.text;
                    return h(
                      'li',
                      {
                        key: `${match.item.kind}-${itemKey}`,
                        id: `cx-filters-typeahead-item-${idx}`,
                        class: `cx-filters-typeahead-item${isActive ? ' cx-filters-typeahead-item--active' : ''}`,
                        role: 'option',
                        'aria-selected': isActive ? 'true' : 'false',
                        'data-testid': 'cx-filters-typeahead-item',
                        'data-typeahead-item-index': String(idx),
                        'data-typeahead-item-kind': match.item.kind,
                        style: {
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          background: isActive ? '#eff6ff' : 'transparent',
                        },
                        onClick: () => {
                          typeaheadActiveIdx.value = idx;
                          commitTypeaheadSelection();
                        },
                      },
                      [
                        h('span', {}, renderMatchLabel(displayLabel, typeaheadQuery.value)),
                        // "recent" badge for
                        // items committed earlier this session.
                        match.item.recent === true
                          ? h(
                              'span',
                              {
                                class: 'cx-filters-typeahead-item__recent',
                                'data-testid': 'cx-filters-typeahead-item-recent',
                                style: {
                                  fontSize: '10px',
                                  color: '#92400e',
                                  backgroundColor: '#fef3c7',
                                  padding: '0 4px',
                                  borderRadius: '3px',
                                  marginLeft: 'auto',
                                  marginRight: '4px',
                                },
                              },
                              'recent',
                            )
                          : null,
                        // histogram count
                        // badge for value items (Decision A.1 + B.1).
                        match.item.kind === 'value' && match.item.count != null
                          ? h(
                              'span',
                              {
                                class: 'cx-filters-typeahead-item__count',
                                'data-testid': 'cx-filters-typeahead-item-count',
                                style: {
                                  fontSize: '10px',
                                  color: '#6b7280',
                                  marginLeft: match.item.recent === true ? '0' : 'auto',
                                  marginRight: '4px',
                                },
                              },
                              `(${match.item.count})`,
                            )
                          : null,
                        h(
                          'span',
                          {
                            class: 'cx-filters-typeahead-item__category',
                            style: {
                              fontSize: '10px',
                              color: '#6b7280',
                              textTransform: 'lowercase',
                            },
                          },
                          match.item.kind,
                        ),
                      ],
                    );
                  }),
            )
          : null,
      ]);
  },
});
