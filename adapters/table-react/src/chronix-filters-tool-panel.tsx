/**
 * Phase 82 (2026-05-30 — react port): pre-built filters tool
 * panel component the consumer drops into Phase 80's
 * `ToolPanelDescriptor.renderer` slot.
 *
 * Pure UI wrapper over `TableHandle.setFilter` +
 * `TableHandle.clearFilter` + `TableHandle.setAdvancedFilter` +
 * `TableHandle.parseAndSetAdvancedFilter`.
 *
 * Phase 100.2 (2026-05-31 — react port): wires the cx-kit Phase 100
 * autocomplete helpers into the advanced-filter textarea as a column-
 * name typeahead popover. Verbatim mirror of vue3 Phase 100.2.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';

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
   * Phase 100.2.2 (2026-06-01 — react port): row population for value
   * typeahead. Verbatim mirror of vue3.
   */
  readonly advancedFilterValueSourceRows?: readonly RowSpec[];
  /**
   * Phase 100.2.2.3 (2026-06-01 — react port): consumer-supplied date
   * formatter for value typeahead. Verbatim mirror of vue3.
   */
  readonly formatTypeaheadDateValue?: (iso: string) => string;
  /**
   * Phase 100.2.3.1 (2026-06-01 — react port): consumer operator
   * override dictionary. Verbatim mirror of vue3.
   */
  readonly operatorsByCustomColumnType?: Readonly<Record<string, readonly string[]>>;
  /**
   * Phase 100.2.3.2 (2026-06-01 — react port): consumer-supplied
   * localized operator label dictionary. Verbatim mirror of vue3.
   */
  readonly operatorLabels?: Readonly<Record<string, string>>;
  /**
   * Phase 100.2.5 (2026-06-01 — react port): per-slot-kind recent ring
   * cap. Verbatim mirror of vue3.
   */
  readonly typeaheadRecentLimit?: number;
  /**
   * Phase 100.2.2.1 (2026-06-01 — react port) + Phase 118
   * (2026-06-02): consumer-supplied async value getter. Optional
   * 3rd arg `signal?: AbortSignal` for fetch-cancellation.
   */
  readonly advancedFilterValueGetter?: (
    colId: string,
    query: string,
    signal?: AbortSignal,
  ) => Promise<readonly ColumnUniqueValue[]>;
  /**
   * Phase 112 (2026-06-01 — react port): persistence backend selector
   * for typeahead recent rings. Verbatim mirror of vue3.
   */
  readonly typeaheadRecentStorage?: 'memory' | 'localStorage';
  /**
   * Phase 118 (2026-06-02 — react port): typeahead recent scope.
   * Verbatim mirror of vue3 Phase 118.
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
  const source = spec.source ?? '';
  const snippet = source.length > 80 ? `${source.slice(0, 80)}…` : source;
  return `「高级筛选」: ${snippet}`;
}

/**
 * Phase 100.2 (2026-05-31 — react port): word-at-cursor extraction
 * for the advanced filter typeahead. Verbatim mirror of vue3.
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
 * Phase 100.2.1 (2026-06-01 — react port): 12 advanced-filter
 * operators. Verbatim mirror of vue3.
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
 * Phase 100.2.1 (2026-06-01 — react port): 3 conjunction / negation
 * keywords. Verbatim mirror of vue3.
 */
export const ADVANCED_FILTER_KEYWORDS: readonly string[] = ['AND', 'OR', 'NOT'];

/**
 * Phase 100.2.3 (2026-06-01 — react port): per-column-type allowed
 * operator subset. Verbatim mirror of vue3.
 */
export const OPERATORS_BY_COLUMN_TYPE: Readonly<Record<string, readonly string[]>> = {
  text: ['=', '!=', 'contains', 'startsWith', 'endsWith', 'in', 'isNull', 'isNotNull'],
  number: ['=', '!=', '>', '<', '>=', '<=', 'in', 'isNull', 'isNotNull'],
  date: ['=', '!=', '>', '<', '>=', '<=', 'isNull', 'isNotNull'],
  boolean: ['=', '!=', 'isNull', 'isNotNull'],
};

const ADVANCED_FILTER_OPERATOR_SET = new Set(ADVANCED_FILTER_OPERATORS);
const ADVANCED_FILTER_KEYWORD_SET = new Set(['AND', 'OR', 'NOT']);

export type TypeaheadSlot = 'column' | 'operator' | 'value' | 'conjunction';

/** Phase 118 (2026-06-02 — react port): frozen empty ring sentinel. */
const EMPTY_RECENT_RING_REACT: readonly string[] = Object.freeze([]);

/**
 * Phase 100.2.1 (2026-06-01 — react port): token-back slot
 * detection. Verbatim mirror of vue3 `detectTypeaheadSlot`.
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
  const isTerminator = (ch: string | undefined): boolean => {
    if (ch == null) return true;
    return ' \t\n\r=!><(),"'.includes(ch);
  };
  let i = safePos;
  while (i > 0 && !isTerminator(text[i - 1])) i--;
  while (i > 0 && (text[i - 1] === ' ' || text[i - 1] === '\t' || text[i - 1] === '\n')) i--;
  if (i === 0) return { slot: 'column' };
  const ch = text[i - 1];
  if (ch === '(' || ch === ',') return { slot: 'column', prevToken: ch };
  if (ch === '"') {
    // Phase 100.2.2.4 (2026-06-01 — react port): disambiguate opening
    // vs closing quote. Verbatim mirror of vue3.
    let quoteCountBefore = 0;
    for (let k = 0; k < i - 1; k++) {
      if (text[k] === '"' && (k === 0 || text[k - 1] !== '\\')) quoteCountBefore++;
    }
    if (quoteCountBefore % 2 === 0) {
      let j = i - 1;
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
        while (opStart > 0 && !isTerminator(text[opStart - 1])) opStart--;
      } else {
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
    return { slot: 'conjunction', prevToken: '"' };
  }
  if (ch === ')') return { slot: 'conjunction', prevToken: ')' };
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
    // Phase 100.2.2: also read prior identifier as prevColumn.
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
  const end = i;
  let start = i;
  while (start > 0 && !isTerminator(text[start - 1])) start--;
  const tokenText = text.slice(start, end);
  if (ADVANCED_FILTER_KEYWORD_SET.has(tokenText.toUpperCase())) {
    return { slot: 'column', prevToken: tokenText };
  }
  if (ADVANCED_FILTER_OPERATOR_SET.has(tokenText)) {
    if (tokenText === 'isNull' || tokenText === 'isNotNull') {
      return { slot: 'conjunction', prevToken: tokenText };
    }
    // Phase 100.2.2: also read prior identifier as prevColumn for
    // word-shaped operators.
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
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(tokenText)) {
    return { slot: 'conjunction', prevToken: tokenText };
  }
  return { slot: 'operator', prevToken: tokenText };
}

/**
 * Phase 100.2.1 (2026-06-01 — react port): discriminated-union
 * typeahead item shape.
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
 * Phase 100.2.2 (2026-06-01 — react port): format a column value as
 * its DSL representation. Verbatim mirror of vue3.
 */
export function formatValueAsDsl(value: string | number | boolean | null): {
  readonly text: string;
  readonly valueKind: 'string' | 'number' | 'boolean' | 'null';
} {
  if (value === null) return { text: 'null', valueKind: 'null' };
  if (typeof value === 'number') return { text: String(value), valueKind: 'number' };
  if (typeof value === 'boolean') return { text: String(value), valueKind: 'boolean' };
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return { text: `"${escaped}"`, valueKind: 'string' };
}

export function ChronixFiltersToolPanel(props: ChronixFiltersToolPanelProps): ReactElement {
  const {
    tableHandle,
    columns,
    filterSpec,
    advancedFilterValueSourceRows,
    formatTypeaheadDateValue,
    operatorsByCustomColumnType,
    operatorLabels,
    typeaheadRecentLimit,
    advancedFilterValueGetter,
    typeaheadRecentStorage,
    typeaheadRecentScope = 'global',
  } = props;
  const effectiveTypeaheadRecentLimit = Math.max(0, Math.min(20, typeaheadRecentLimit ?? 5));
  // Phase 112 (2026-06-01 — react port): pick storage backend per
  // prop; `useMemo` keeps the storage stable across renders so the
  // hydration `useEffect` runs once on mount.
  const typeaheadRecentStorageImpl = useMemo<TypeaheadRecentStorage>(
    () =>
      typeaheadRecentStorage === 'localStorage'
        ? createLocalStorageRecentStorage(DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX)
        : createMemoryRecentStorage(),
    [typeaheadRecentStorage],
  );
  const [advancedFilterText, setAdvancedFilterText] = useState('');
  const [parseErrors, setParseErrors] = useState<readonly ParseFilterExpressionError[]>([]);

  const [typeaheadOpen, setTypeaheadOpen] = useState(false);
  const [typeaheadActiveIdx, setTypeaheadActiveIdx] = useState(-1);
  const [typeaheadAnchorRect, setTypeaheadAnchorRect] = useState<DOMRect | null>(null);
  const [typeaheadQuery, setTypeaheadQuery] = useState('');
  const [typeaheadWordRange, setTypeaheadWordRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typeaheadPopoverRef = useRef<HTMLElement | null>(null);
  // Mirror typeaheadOpen for the document-level listener registered
  // once on mount so it reads latest state without re-subscribing.
  const typeaheadOpenStateRef = useRef<boolean>(false);
  typeaheadOpenStateRef.current = typeaheadOpen;

  const chips = useMemo(
    () =>
      filterSpec.map((spec, index) => ({
        index,
        spec,
        label: formatFilterChipLabel(spec, columns),
      })),
    [filterSpec, columns],
  );

  // Phase 100.2.1 + Phase 100.2.2 + Phase 100.2.3 (2026-06-01 — react
  // port): typeahead slot detection state. Verbatim mirror of vue3.
  const [typeaheadSlotDetected, setTypeaheadSlotDetected] = useState<{
    readonly slot: TypeaheadSlot;
    readonly prevToken?: string;
    readonly prevColumn?: string;
  }>({ slot: 'column' });

  // Phase 100.2.2 (2026-06-01 — react port): per-colId value source
  // cache; invalidated on prop reference change. Verbatim mirror of
  // vue3.
  const valueSourceCacheByColIdRef = useRef<Map<string, CollectUniqueColumnValuesResult>>(
    new Map(),
  );
  useEffect(() => {
    valueSourceCacheByColIdRef.current = new Map();
  }, [advancedFilterValueSourceRows]);

  // Phase 100.2.2.4 (2026-06-01 — react port): open-string-literal flag.
  const [typeaheadInsideStringLiteral, setTypeaheadInsideStringLiteral] = useState(false);

  // Phase 100.2.5 (2026-06-01 — react port): per-slot-kind recent rings.
  //
  // Phase 112 (2026-06-01 — react port): hydrate from storage backend
  // on mount; write-through on every `pushToRecent`. Verbatim mirror
  // of vue3.
  // Phase 118 (2026-06-02 — react port): key widened from
  // TypeaheadSlot to string so per-column scope can use
  // `${slot}:${colId}` keys.
  const [recentTypeaheadByKind, setRecentTypeaheadByKind] = useState<
    ReadonlyMap<string, readonly string[]>
  >(new Map());
  useEffect(() => {
    const slots: readonly TypeaheadSlot[] = ['column', 'operator', 'value', 'conjunction'];
    const hydrated = new Map<string, readonly string[]>();
    for (const slot of slots) {
      const ring = typeaheadRecentStorageImpl.read(slot);
      if (ring.length > 0) hydrated.set(slot, ring);
    }
    if (hydrated.size > 0) setRecentTypeaheadByKind(hydrated);
  }, [typeaheadRecentStorageImpl]);
  // Phase 118 (2026-06-02 — react port): per-column recent-key helper.
  const recentKey = useCallback(
    (slot: TypeaheadSlot, colId?: string | null): string => {
      if (
        typeaheadRecentScope === 'per-column-value' &&
        slot === 'value' &&
        colId != null &&
        colId !== ''
      ) {
        return `${slot}:${colId}`;
      }
      return slot;
    },
    [typeaheadRecentScope],
  );
  const pushToRecent = useCallback(
    (slot: TypeaheadSlot, text: string, colId?: string | null): void => {
      if (effectiveTypeaheadRecentLimit === 0) return;
      const key = recentKey(slot, colId);
      setRecentTypeaheadByKind((prev) => {
        const existing = prev.get(key) ?? [];
        const filtered = existing.filter((t) => t !== text);
        const next = [text, ...filtered].slice(0, effectiveTypeaheadRecentLimit);
        const newMap = new Map(prev);
        newMap.set(key, next);
        typeaheadRecentStorageImpl.write(key, next);
        return newMap;
      });
    },
    [effectiveTypeaheadRecentLimit, typeaheadRecentStorageImpl, recentKey],
  );
  // Phase 118 (2026-06-02 — react port): readRecent with lazy storage rehydration.
  const readRecent = useCallback(
    (slot: TypeaheadSlot, colId?: string | null): readonly string[] => {
      const key = recentKey(slot, colId);
      const cached = recentTypeaheadByKind.get(key);
      if (cached != null) return cached;
      const ring = typeaheadRecentStorageImpl.read(key);
      if (ring.length === 0) return EMPTY_RECENT_RING_REACT;
      setRecentTypeaheadByKind((prev) => {
        if (prev.get(key) != null) return prev;
        const newMap = new Map(prev);
        newMap.set(key, ring);
        return newMap;
      });
      return ring;
    },
    [recentTypeaheadByKind, typeaheadRecentStorageImpl, recentKey],
  );

  // Phase 100.2.2.1 (2026-06-01 — react port): SSR async value getter
  // cache + race-token. Verbatim mirror of vue3 (with React refs +
  // a state-bump to trigger re-render on async resolve).
  const asyncValueResultsByKeyRef = useRef<
    Map<string, readonly ColumnUniqueValue[] | 'loading' | 'error'>
  >(new Map());
  const asyncRequestIdByKeyRef = useRef<Map<string, number>>(new Map());
  const nextAsyncRequestIdRef = useRef<number>(1);
  // Phase 118 (2026-06-02 — react port): per-key AbortController.
  const asyncAbortControllerByKeyRef = useRef<Map<string, AbortController>>(new Map());
  const [asyncResultsVersion, setAsyncResultsVersion] = useState<number>(0);
  useEffect(() => {
    asyncValueResultsByKeyRef.current = new Map();
    asyncRequestIdByKeyRef.current = new Map();
    // Phase 118: abort all in-flight on getter swap.
    for (const controller of asyncAbortControllerByKeyRef.current.values()) {
      try {
        controller.abort();
      } catch {
        // ignore
      }
    }
    asyncAbortControllerByKeyRef.current.clear();
    setAsyncResultsVersion((v) => v + 1);
  }, [advancedFilterValueGetter]);
  const fetchAsyncValues = useCallback(
    (colId: string, query: string): void => {
      if (advancedFilterValueGetter == null) return;
      const key = `${colId}::${query}`;
      const cached = asyncValueResultsByKeyRef.current.get(key);
      if (cached != null) return;
      const requestId = nextAsyncRequestIdRef.current++;
      asyncRequestIdByKeyRef.current.set(key, requestId);
      asyncValueResultsByKeyRef.current.set(key, 'loading');
      // Phase 118: abort prior in-flight controller for this key + allocate fresh.
      const prior = asyncAbortControllerByKeyRef.current.get(key);
      if (prior != null) {
        try {
          prior.abort();
        } catch {
          // ignore
        }
      }
      const controller = new AbortController();
      asyncAbortControllerByKeyRef.current.set(key, controller);
      setAsyncResultsVersion((v) => v + 1);
      void advancedFilterValueGetter(colId, query, controller.signal).then(
        (results) => {
          if (asyncRequestIdByKeyRef.current.get(key) !== requestId) return;
          asyncAbortControllerByKeyRef.current.delete(key);
          asyncValueResultsByKeyRef.current.set(key, results);
          setAsyncResultsVersion((v) => v + 1);
        },
        () => {
          if (asyncRequestIdByKeyRef.current.get(key) !== requestId) return;
          asyncAbortControllerByKeyRef.current.delete(key);
          asyncValueResultsByKeyRef.current.set(key, 'error');
          setAsyncResultsVersion((v) => v + 1);
        },
      );
    },
    [advancedFilterValueGetter],
  );

  const typeaheadMatches = useMemo<readonly AutocompleteMatch<TypeaheadItem>[]>(() => {
    if (!typeaheadOpen) return [];
    // Phase 100.2.1: gate item source on detected slot.
    let items: TypeaheadItem[];
    if (typeaheadSlotDetected.slot === 'column') {
      items = columns.map((c) => ({
        kind: 'column' as const,
        colId: c.id,
        label: c.headerName ?? c.id,
      }));
    } else if (typeaheadSlotDetected.slot === 'operator') {
      // Phase 100.2.3 (2026-06-01 — react port): operator subset by
      // column type. Verbatim mirror of vue3.
      // Phase 100.2.3.1 + 100.2.3.2 (2026-06-01 — react port): consumer
      // override dict + localized labels. Verbatim mirror of vue3.
      const colId = typeaheadSlotDetected.prevToken;
      const column = colId != null ? columns.find((c) => c.id === colId) : undefined;
      const mergedOperatorsByType = {
        ...OPERATORS_BY_COLUMN_TYPE,
        ...(operatorsByCustomColumnType ?? {}),
      };
      const allowed =
        column?.type != null && column.type in mergedOperatorsByType
          ? mergedOperatorsByType[column.type]!
          : ADVANCED_FILTER_OPERATORS;
      items = allowed.map((op) => {
        const labelOverride = operatorLabels?.[op];
        return labelOverride != null
          ? { kind: 'operator' as const, text: op, displayText: labelOverride }
          : { kind: 'operator' as const, text: op };
      });
    } else if (typeaheadSlotDetected.slot === 'conjunction') {
      items = ADVANCED_FILTER_KEYWORDS.map((kw) => ({
        kind: 'keyword' as const,
        text: kw,
      }));
    } else {
      // Phase 100.2.2 + 100.2.2.1 + 100.2.2.4 (2026-06-01 — react
      // port): value slot pipeline; async getter wins over rows
      // (Decision R.1); inside-open-literal filters to string-kind.
      // Verbatim mirror of vue3.
      const colId = typeaheadSlotDetected.prevColumn;
      if (colId == null) return [];
      const column = columns.find((c) => c.id === colId);
      if (column == null) return [];
      let valueSourceList: readonly ColumnUniqueValue[];
      if (advancedFilterValueGetter != null) {
        const asyncKey = `${colId}::${typeaheadQuery}`;
        const cachedAsync = asyncValueResultsByKeyRef.current.get(asyncKey);
        if (cachedAsync == null || cachedAsync === 'loading' || cachedAsync === 'error') {
          return [];
        }
        valueSourceList = cachedAsync;
      } else {
        const sourceRows = advancedFilterValueSourceRows;
        if (sourceRows == null || sourceRows.length === 0) return [];
        let cached = valueSourceCacheByColIdRef.current.get(colId);
        if (cached == null) {
          cached = collectUniqueColumnValues({
            rows: sourceRows,
            column,
            maxValues: 100,
          });
          valueSourceCacheByColIdRef.current.set(colId, cached);
        }
        valueSourceList = cached.values;
      }
      const filteredValueList = typeaheadInsideStringLiteral
        ? valueSourceList.filter((v) => typeof v.value === 'string')
        : valueSourceList;
      items = filteredValueList.map((v) => {
        const formatted = formatValueAsDsl(v.value);
        // Phase 100.2.2.3 (2026-06-01 — react port): date formatter
        // displayText (verbatim mirror of vue3).
        let displayText: string | undefined;
        if (
          column.type === 'date' &&
          formatTypeaheadDateValue != null &&
          formatted.valueKind === 'string'
        ) {
          const isoBare = formatted.text.slice(1, -1);
          displayText = `"${formatTypeaheadDateValue(isoBare)}"`;
        }
        // Phase 100.2.2.2 (2026-06-01 — react port): histogram count
        // pass-through (verbatim mirror of vue3).
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
    // Phase 100.2.5 (2026-06-01 — react port): recent overlay.
    // Phase 118 (2026-06-02 — react port): per-column scope routing.
    const recentReadColId =
      typeaheadSlotDetected.slot === 'value' && typeof typeaheadSlotDetected.prevToken === 'string'
        ? typeaheadSlotDetected.prevToken
        : null;
    const recentTexts = readRecent(typeaheadSlotDetected.slot, recentReadColId);
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
    return filterAutocompleteItems<TypeaheadItem>({
      items: itemsWithRecent,
      query: typeaheadQuery,
      getText: (i) => (i.kind === 'column' ? `${i.colId} ${i.label}` : i.text),
    });
  }, [
    typeaheadOpen,
    columns,
    typeaheadQuery,
    typeaheadSlotDetected,
    advancedFilterValueSourceRows,
    formatTypeaheadDateValue,
    operatorsByCustomColumnType,
    operatorLabels,
    advancedFilterValueGetter,
    typeaheadInsideStringLiteral,
    recentTypeaheadByKind,
    asyncResultsVersion,
  ]);

  // Phase 100.2.2.1 (2026-06-01 — react port): async placeholder
  // state. Verbatim mirror of vue3.
  const asyncPlaceholderState = useMemo<'loading' | 'error' | null>(() => {
    if (!typeaheadOpen) return null;
    if (typeaheadSlotDetected.slot !== 'value' || typeaheadSlotDetected.prevColumn == null)
      return null;
    if (advancedFilterValueGetter == null) return null;
    const key = `${typeaheadSlotDetected.prevColumn}::${typeaheadQuery}`;
    const cached = asyncValueResultsByKeyRef.current.get(key);
    if (cached === 'loading') return 'loading';
    if (cached === 'error') return 'error';
    return null;
  }, [
    typeaheadOpen,
    typeaheadSlotDetected,
    typeaheadQuery,
    advancedFilterValueGetter,
    asyncResultsVersion,
  ]);

  const removeFilterAt = (index: number): void => {
    if (tableHandle == null) return;
    const spec = filterSpec[index];
    if (spec?.type === 'expression') {
      tableHandle.setAdvancedFilter(null);
      return;
    }
    const next = filterSpec.filter((_, i) => i !== index);
    tableHandle.setFilter(next);
  };

  const clearAll = (): void => {
    if (tableHandle == null) return;
    tableHandle.clearFilter();
    tableHandle.setAdvancedFilter(null);
  };

  const applyAdvancedFilter = (): void => {
    if (tableHandle == null) return;
    const result = tableHandle.parseAndSetAdvancedFilter(advancedFilterText);
    setParseErrors(result.ok ? [] : result.errors);
  };

  const closeTypeahead = useCallback((): void => {
    setTypeaheadOpen(false);
    setTypeaheadActiveIdx(-1);
    setTypeaheadQuery('');
    setTypeaheadWordRange(null);
    setTypeaheadInsideStringLiteral(false);
  }, []);

  const refreshTypeaheadAnchor = useCallback((): void => {
    const ta = textareaRef.current;
    if (ta == null) return;
    setTypeaheadAnchorRect(ta.getBoundingClientRect());
  }, []);

  // Phase 100.2.4 (2026-06-01 — react port): extracted from
  // `onTextareaChange` so the post-commit auto-trigger path (in
  // `commitTypeaheadSelection`) can re-run typeahead detection at the
  // post-insertion cursor (Decision J.1 — verbatim mirror of vue3).
  // `allowEmptyWord` bypasses the empty-word guard so the next-slot
  // popover opens after a column/operator/keyword commit even though
  // the cursor sits just past the appended trailing space.
  const triggerTypeaheadAt = useCallback(
    (value: string, cursorPos: number, allowEmptyWord = false): void => {
      setAdvancedFilterText(value);
      const extracted = extractWordAtCursor(value, cursorPos);
      const detected = detectTypeaheadSlot(value, cursorPos);
      // Phase 100.2.2.4 (2026-06-01 — react port): allow value-slot
      // typeahead inside open string literal. Verbatim mirror of vue3.
      if (extracted.isInsideStringLiteral) {
        if (detected.slot !== 'value' || detected.prevColumn == null) {
          closeTypeahead();
          return;
        }
      } else if (extracted.word === '' && !allowEmptyWord) {
        closeTypeahead();
        return;
      }
      // Build items per slot so we can compute initial active idx
      // synchronously. Mirrors `typeaheadMatches` logic.
      let items: TypeaheadItem[];
      if (detected.slot === 'column') {
        items = columns.map((c) => ({
          kind: 'column' as const,
          colId: c.id,
          label: c.headerName ?? c.id,
        }));
      } else if (detected.slot === 'operator') {
        const colId = detected.prevToken;
        const column = colId != null ? columns.find((c) => c.id === colId) : undefined;
        const mergedOperatorsByType = {
          ...OPERATORS_BY_COLUMN_TYPE,
          ...(operatorsByCustomColumnType ?? {}),
        };
        const allowed =
          column?.type != null && column.type in mergedOperatorsByType
            ? mergedOperatorsByType[column.type]!
            : ADVANCED_FILTER_OPERATORS;
        items = allowed.map((op) => {
          const labelOverride = operatorLabels?.[op];
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
        // Phase 100.2.2 + 100.2.2.1 + 100.2.2.4 value branch.
        const colId = detected.prevColumn;
        items = [];
        if (colId != null) {
          const column = columns.find((c) => c.id === colId);
          if (column != null) {
            let valueSourceList: readonly ColumnUniqueValue[] | null = null;
            if (advancedFilterValueGetter != null) {
              const asyncKey = `${colId}::${extracted.word}`;
              const cachedAsync = asyncValueResultsByKeyRef.current.get(asyncKey);
              if (cachedAsync != null && cachedAsync !== 'loading' && cachedAsync !== 'error') {
                valueSourceList = cachedAsync;
              }
            } else {
              const sourceRows = advancedFilterValueSourceRows;
              if (sourceRows != null && sourceRows.length > 0) {
                let cached = valueSourceCacheByColIdRef.current.get(colId);
                if (cached == null) {
                  cached = collectUniqueColumnValues({
                    rows: sourceRows,
                    column,
                    maxValues: 100,
                  });
                  valueSourceCacheByColIdRef.current.set(colId, cached);
                }
                valueSourceList = cached.values;
              }
            }
            if (valueSourceList != null) {
              const filteredValueList = extracted.isInsideStringLiteral
                ? valueSourceList.filter((v) => typeof v.value === 'string')
                : valueSourceList;
              items = filteredValueList.map((v) => {
                const formatted = formatValueAsDsl(v.value);
                let displayText: string | undefined;
                if (
                  column.type === 'date' &&
                  formatTypeaheadDateValue != null &&
                  formatted.valueKind === 'string'
                ) {
                  const isoBare = formatted.text.slice(1, -1);
                  displayText = `"${formatTypeaheadDateValue(isoBare)}"`;
                }
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
          }
        }
      }
      const matches = filterAutocompleteItems<TypeaheadItem>({
        items,
        query: extracted.word,
        getText: (i) => (i.kind === 'column' ? `${i.colId} ${i.label}` : i.text),
      });
      setTypeaheadSlotDetected(detected);
      setTypeaheadInsideStringLiteral(extracted.isInsideStringLiteral);
      setTypeaheadQuery(extracted.word);
      setTypeaheadWordRange({ start: extracted.start, end: extracted.end });
      setTypeaheadOpen(true);
      refreshTypeaheadAnchor();
      // Phase 100.2.2.1 (2026-06-01 — react port): fire async getter.
      if (
        detected.slot === 'value' &&
        detected.prevColumn != null &&
        advancedFilterValueGetter != null
      ) {
        fetchAsyncValues(detected.prevColumn, extracted.word);
      }
      setTypeaheadActiveIdx(matches.length > 0 ? 0 : -1);
    },
    [
      closeTypeahead,
      refreshTypeaheadAnchor,
      columns,
      advancedFilterValueSourceRows,
      formatTypeaheadDateValue,
      operatorsByCustomColumnType,
      operatorLabels,
      advancedFilterValueGetter,
      fetchAsyncValues,
    ],
  );

  const onTextareaChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>): void => {
      const ta = e.target;
      const cursorPos = ta.selectionStart ?? ta.value.length;
      triggerTypeaheadAt(ta.value, cursorPos);
    },
    [triggerTypeaheadAt],
  );

  const commitTypeaheadSelection = useCallback((): void => {
    const idx = typeaheadActiveIdx;
    const wordRange = typeaheadWordRange;
    if (idx < 0 || idx >= typeaheadMatches.length || wordRange == null) return;
    const active = typeaheadMatches[idx];
    if (active == null) return;
    // Phase 100.2.1 + 100.2.2.4: column items insert `colId`; operator
    // / keyword / value items insert their literal text. Value items
    // inside an open string literal context insert bare-value +
    // closing `"` (verbatim mirror of vue3 100.2.2.4 N.1).
    let insertText: string;
    if (
      active.item.kind === 'value' &&
      typeaheadInsideStringLiteral &&
      active.item.valueKind === 'string'
    ) {
      insertText = active.item.text.slice(1);
    } else {
      insertText = active.item.kind === 'column' ? active.item.colId : active.item.text;
    }
    const nextText =
      advancedFilterText.slice(0, wordRange.start) +
      insertText +
      advancedFilterText.slice(wordRange.end);
    const newCursorPos = wordRange.start + insertText.length;
    // Phase 100.2.4 (2026-06-01 — react port): auto-trigger on non-value
    // commits. Verbatim mirror of vue3.
    const shouldAutoTrigger = active.item.kind !== 'value';
    const finalText = shouldAutoTrigger
      ? nextText.slice(0, newCursorPos) + ' ' + nextText.slice(newCursorPos)
      : nextText;
    const finalCursorPos = shouldAutoTrigger ? newCursorPos + 1 : newCursorPos;
    // Phase 100.2.5 (2026-06-01 — react port): push to recent ring.
    // Phase 118 (2026-06-02 — react port): per-column scope for value
    // commits when `typeaheadRecentScope === 'per-column-value'`.
    const slot = typeaheadSlotDetected.slot;
    const pushText = active.item.kind === 'column' ? active.item.colId : active.item.text;
    const pushColId =
      slot === 'value' && typeof typeaheadSlotDetected.prevToken === 'string'
        ? typeaheadSlotDetected.prevToken
        : null;
    pushToRecent(slot, pushText, pushColId);
    setAdvancedFilterText(finalText);
    const ta = textareaRef.current;
    if (ta != null) {
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
  }, [
    typeaheadActiveIdx,
    typeaheadWordRange,
    typeaheadMatches,
    advancedFilterText,
    closeTypeahead,
    triggerTypeaheadAt,
    typeaheadInsideStringLiteral,
    typeaheadSlotDetected,
    pushToRecent,
  ]);

  const onTextareaKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (!typeaheadOpen) return;
      if (typeaheadMatches.length === 0) {
        if (e.key === 'Escape') closeTypeahead();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setTypeaheadActiveIdx((i) => (i + 1) % typeaheadMatches.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setTypeaheadActiveIdx((i) => (i <= 0 ? typeaheadMatches.length - 1 : i - 1));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (typeaheadActiveIdx < 0) return;
        e.preventDefault();
        commitTypeaheadSelection();
      } else if (e.key === 'Escape') {
        closeTypeahead();
      }
    },
    [
      typeaheadOpen,
      typeaheadMatches.length,
      typeaheadActiveIdx,
      commitTypeaheadSelection,
      closeTypeahead,
    ],
  );

  // Document-level outside-click closes the popover. Registered once
  // on mount; reads latest open state via the mirror ref. Inlines
  // the close logic to avoid forward-referencing `closeTypeahead`
  // (per Phase 99.2-fr5 lesson).
  useEffect(() => {
    const onPointerDown = (e: PointerEvent): void => {
      if (!typeaheadOpenStateRef.current) return;
      const target = e.target as Node | null;
      const ta = textareaRef.current;
      const pop = typeaheadPopoverRef.current;
      if (ta != null && target != null && ta.contains(target)) return;
      if (pop != null && target != null && pop.contains(target)) return;
      setTypeaheadOpen(false);
      setTypeaheadActiveIdx(-1);
      setTypeaheadQuery('');
      setTypeaheadWordRange(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  // Phase 100.2.6 (2026-06-01 — react port): scroll the active
  // typeahead item into view when `typeaheadActiveIdx` changes
  // (verbatim mirror of vue3 watch).
  useEffect(() => {
    if (typeaheadActiveIdx < 0) return;
    const listbox = typeaheadPopoverRef.current;
    if (listbox == null) return;
    const activeEl = listbox.querySelector<HTMLElement>(
      `[data-typeahead-item-index="${typeaheadActiveIdx}"]`,
    );
    if (activeEl == null) return;
    // Defensive guard: jsdom (react test env) doesn't ship
    // scrollIntoView. Skip silently in that case.
    if (typeof activeEl.scrollIntoView !== 'function') return;
    activeEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [typeaheadActiveIdx]);

  function renderMatchLabel(label: string, query: string): ReactElement[] {
    const spans = computeMatchSpans(label, query, 'substring');
    if (spans.length === 0) return [<span key="plain">{label}</span>];
    const span = spans[0]!;
    const before = label.slice(0, span.start);
    const match = label.slice(span.start, span.end);
    const after = label.slice(span.end);
    const children: ReactElement[] = [];
    if (before !== '') children.push(<span key="before">{before}</span>);
    children.push(
      <span
        key="match"
        className="cx-filters-typeahead-item__match"
        style={{ fontWeight: 600, backgroundColor: '#fef3c7' }}
      >
        {match}
      </span>,
    );
    if (after !== '') children.push(<span key="after">{after}</span>);
    return children;
  }

  return (
    <div className="cx-table-filters-tool-panel">
      <div className="cx-table-filters-tool-panel__header">
        <button
          type="button"
          className="cx-table-filters-tool-panel__clear-all"
          data-testid="cx-filters-tool-panel-clear-all"
          onClick={clearAll}
        >
          清除全部筛选
        </button>
      </div>
      <div className="cx-table-filters-tool-panel__body">
        <div className="cx-table-filters-tool-panel__chips">
          {chips.length === 0 ? (
            <div className="cx-table-filters-tool-panel__empty">当前无筛选</div>
          ) : (
            chips.map((chip) => (
              <div
                key={chip.index}
                className="cx-table-filters-tool-panel__chip"
                data-tool-panel-chip-index={String(chip.index)}
              >
                <span className="cx-table-filters-tool-panel__chip-label">{chip.label}</span>
                <button
                  type="button"
                  className="cx-table-filters-tool-panel__chip-close"
                  aria-label="移除该筛选"
                  data-testid={`cx-filters-tool-panel-chip-close-${chip.index}`}
                  onClick={() => removeFilterAt(chip.index)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        <div className="cx-table-filters-tool-panel__advanced">
          <label className="cx-table-filters-tool-panel__advanced-label">
            高级筛选 (表达式 DSL)
          </label>
          <textarea
            ref={textareaRef}
            className="cx-table-filters-tool-panel__textarea"
            rows={3}
            placeholder='如 name contains "foo" and qty > 10'
            value={advancedFilterText}
            data-testid="cx-filters-tool-panel-advanced-textarea"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={typeaheadOpen ? true : false}
            aria-controls="cx-filters-typeahead-listbox"
            aria-activedescendant={
              typeaheadOpen && typeaheadActiveIdx >= 0
                ? `cx-filters-typeahead-item-${typeaheadActiveIdx}`
                : undefined
            }
            onChange={onTextareaChange}
            onKeyDown={onTextareaKeyDown}
          />
          <button
            type="button"
            className="cx-table-filters-tool-panel__apply"
            data-testid="cx-filters-tool-panel-advanced-apply"
            onClick={applyAdvancedFilter}
          >
            应用
          </button>
          {parseErrors.length > 0 ? (
            <ul
              className="cx-table-filters-tool-panel__errors"
              data-testid="cx-filters-tool-panel-errors"
            >
              {parseErrors.map((err, i) => (
                <li key={i}>{err.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      {typeaheadOpen &&
      (typeaheadMatches.length > 0 || asyncPlaceholderState != null) &&
      typeaheadAnchorRect != null ? (
        <ul
          ref={(el) => {
            typeaheadPopoverRef.current = el;
          }}
          id="cx-filters-typeahead-listbox"
          className="cx-filters-typeahead"
          role="listbox"
          data-testid="cx-filters-typeahead"
          style={{
            position: 'fixed',
            left: `${typeaheadAnchorRect.left}px`,
            top: `${typeaheadAnchorRect.bottom + 4}px`,
            width: `${Math.min(280, typeaheadAnchorRect.width)}px`,
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
          }}
        >
          {asyncPlaceholderState != null ? (
            <li
              className="cx-filters-typeahead-placeholder"
              data-testid={
                asyncPlaceholderState === 'loading'
                  ? 'cx-filters-typeahead-loading'
                  : 'cx-filters-typeahead-error'
              }
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                color: '#6b7280',
                fontStyle: 'italic',
              }}
            >
              {asyncPlaceholderState === 'loading' ? '加载中…' : '加载失败'}
            </li>
          ) : (
            typeaheadMatches.map((match, idx) => {
              const isActive = idx === typeaheadActiveIdx;
              // Phase 100.2.2.3 + 100.2.3.2 (2026-06-01 — react port):
              // displayText override for value / operator items.
              // Verbatim mirror of vue3.
              const displayLabel =
                match.item.kind === 'column'
                  ? match.item.label
                  : (match.item.kind === 'value' || match.item.kind === 'operator') &&
                      match.item.displayText != null
                    ? match.item.displayText
                    : match.item.text;
              const itemKey = match.item.kind === 'column' ? match.item.colId : match.item.text;
              return (
                <li
                  key={`${match.item.kind}-${itemKey}`}
                  id={`cx-filters-typeahead-item-${idx}`}
                  className={`cx-filters-typeahead-item${
                    isActive ? ' cx-filters-typeahead-item--active' : ''
                  }`}
                  role="option"
                  aria-selected={isActive ? true : false}
                  data-testid="cx-filters-typeahead-item"
                  data-typeahead-item-index={String(idx)}
                  data-typeahead-item-kind={match.item.kind}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    background: isActive ? '#eff6ff' : 'transparent',
                  }}
                  onClick={() => {
                    setTypeaheadActiveIdx(idx);
                    commitTypeaheadSelection();
                  }}
                >
                  <span>{renderMatchLabel(displayLabel, typeaheadQuery)}</span>
                  {match.item.recent === true ? (
                    <span
                      className="cx-filters-typeahead-item__recent"
                      data-testid="cx-filters-typeahead-item-recent"
                      style={{
                        fontSize: '10px',
                        color: '#92400e',
                        backgroundColor: '#fef3c7',
                        padding: '0 4px',
                        borderRadius: '3px',
                        marginLeft: 'auto',
                        marginRight: '4px',
                      }}
                    >
                      recent
                    </span>
                  ) : null}
                  {match.item.kind === 'value' && match.item.count != null ? (
                    <span
                      className="cx-filters-typeahead-item__count"
                      data-testid="cx-filters-typeahead-item-count"
                      style={{
                        fontSize: '10px',
                        color: '#6b7280',
                        marginLeft: match.item.recent === true ? '0' : 'auto',
                        marginRight: '4px',
                      }}
                    >
                      ({match.item.count})
                    </span>
                  ) : null}
                  <span
                    className="cx-filters-typeahead-item__category"
                    style={{
                      fontSize: '10px',
                      color: '#6b7280',
                      textTransform: 'lowercase',
                    }}
                  >
                    {match.item.kind}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
