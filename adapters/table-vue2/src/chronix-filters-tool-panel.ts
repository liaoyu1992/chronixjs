/**
 * (2026-05-30 — vue2 port): pre-built filters tool panel
 * SFC. Vue 2.7 verbatim mirror of the vue3 adapter using
 * vnode-data `attrs:` + `on:` + `domProps:` deltas.
 *
 * Pure UI wrapper over `TableHandle.setFilter` +
 * `TableHandle.clearFilter` + `TableHandle.setAdvancedFilter` +
 * `TableHandle.parseAndSetAdvancedFilter`.
 *
 * (2026-05-31 — vue2 port): wires the cx-kit
 * autocomplete helpers into the advanced-filter textarea as a column-
 * name typeahead popover. Verbatim mirror of vue3 .
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
   * (2026-06-01 — vue2 port): row population for value
   * typeahead. Verbatim mirror of vue3.
   */
  readonly advancedFilterValueSourceRows?: readonly RowSpec[];
  /**
   * (2026-06-01 — vue2 port): consumer-supplied date
   * formatter for value typeahead. Verbatim mirror of vue3.
   */
  readonly formatTypeaheadDateValue?: (iso: string) => string;
  /**
   * (2026-06-01 — vue2 port): consumer operator
   * override dictionary. Verbatim mirror of vue3.
   */
  readonly operatorsByCustomColumnType?: Readonly<Record<string, readonly string[]>>;
  /**
   * (2026-06-01 — vue2 port): consumer-supplied
   * localized operator label dictionary. Verbatim mirror of vue3.
   */
  readonly operatorLabels?: Readonly<Record<string, string>>;
  /**
   * (2026-06-01 — vue2 port): per-slot-kind recent ring
   * cap. Verbatim mirror of vue3.
   */
  readonly typeaheadRecentLimit?: number;
  /**
   * (2026-06-01 — vue2 port) +
   * consumer-supplied async value getter. 3rd optional `signal?:
   * AbortSignal` arg for fetch-cancellation on supersession.
   */
  readonly advancedFilterValueGetter?: (
    colId: string,
    query: string,
    signal?: AbortSignal,
  ) => Promise<readonly ColumnUniqueValue[]>;
  /**
   * (2026-06-01 — vue2 port): persistence backend selector
   * for typeahead recent rings. Verbatim mirror of vue3.
   */
  readonly typeaheadRecentStorage?: 'memory' | 'localStorage';
  /**
   * (2026-06-02 — vue2 port): typeahead recent scope.
   * Verbatim mirror of vue3 .
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
 * (2026-05-31 — vue2 port): word-at-cursor extraction
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
 * (2026-06-01 — vue2 port): 12 advanced-filter
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
 * (2026-06-01 — vue2 port): 3 conjunction / negation
 * keywords. Verbatim mirror of vue3.
 */
export const ADVANCED_FILTER_KEYWORDS: readonly string[] = ['AND', 'OR', 'NOT'];

/**
 * (2026-06-01 — vue2 port): per-column-type allowed
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

/** (2026-06-02 — vue2 port): frozen empty ring sentinel. */
const EMPTY_RECENT_RING_VUE2: readonly string[] = Object.freeze([]);

/**
 * (2026-06-01 — vue2 port): token-back slot detection.
 * Verbatim mirror of vue3 `detectTypeaheadSlot`.
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
    // (2026-06-01 — vue2 port): disambiguate opening
    // vs closing quote by counting unescaped `"` chars before this
    // position. Verbatim mirror of vue3.
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
    // also read prior identifier as prevColumn.
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
    // also read prior identifier as prevColumn for
    // word-shaped operators (`contains`, `startsWith`, etc.).
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
 * (2026-06-01 — vue2 port): discriminated-union
 * typeahead item shape. Verbatim mirror of vue3.
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
 * (2026-06-01 — vue2 port): format a column value as
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

    // + + (2026-06-01 — vue2
    // port): typeahead slot detection state. Verbatim mirror of vue3.
    const typeaheadSlotDetected = ref<{
      readonly slot: TypeaheadSlot;
      readonly prevToken?: string;
      readonly prevColumn?: string;
    }>({ slot: 'column' });

    // (2026-06-01 — vue2 port): per-colId value source
    // cache; invalidated on prop reference change. Verbatim mirror of
    // vue3.
    const valueSourceCacheByColId = ref<Map<string, CollectUniqueColumnValuesResult>>(new Map());
    watch(
      () => props.advancedFilterValueSourceRows,
      () => {
        valueSourceCacheByColId.value = new Map();
      },
    );

    // (2026-06-01 — vue2 port): open-string-literal
    // value-slot context flag. Verbatim mirror of vue3.
    const typeaheadInsideStringLiteral = ref<boolean>(false);

    // (2026-06-01 — vue2 port): per-slot-kind recent LRU
    // rings. Verbatim mirror of vue3.
    //
    // (2026-06-01 — vue2 port): opt-in localStorage
    // persistence selected by `typeaheadRecentStorage` prop. Verbatim
    // mirror of vue3.
    // (2026-06-02 — vue2 port): map key widened to string
    // so per-column scope can use `${slot}:${colId}` keys.
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
      const storage = typeaheadRecentStorage.value;
      const slots: readonly TypeaheadSlot[] = ['column', 'operator', 'value', 'conjunction'];
      const hydrated = new Map<string, readonly string[]>();
      for (const slot of slots) {
        const ring = storage.read(slot);
        if (ring.length > 0) hydrated.set(slot, ring);
      }
      if (hydrated.size > 0) recentTypeaheadByKind.value = hydrated;
    });
    // (2026-06-02 — vue2 port): per-column recent-key helper.
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
      typeaheadRecentStorage.value.write(key, next);
    }
    function readRecent(slot: TypeaheadSlot, colId?: string | null): readonly string[] {
      const key = recentKey(slot, colId);
      const cached = recentTypeaheadByKind.value.get(key);
      if (cached != null) return cached;
      const ring = typeaheadRecentStorage.value.read(key);
      if (ring.length === 0) return EMPTY_RECENT_RING_VUE2;
      const newMap = new Map(recentTypeaheadByKind.value);
      newMap.set(key, ring);
      recentTypeaheadByKind.value = newMap;
      return ring;
    }

    // (2026-06-01 — vue2 port): SSR async value getter
    // cache + race-token. Verbatim mirror of vue3.
    const asyncValueResultsByKey = ref<
      Map<string, readonly ColumnUniqueValue[] | 'loading' | 'error'>
    >(new Map());
    const asyncRequestIdByKey = ref<Map<string, number>>(new Map());
    let nextAsyncRequestId = 1;
    // (2026-06-02 — vue2 port): per-key AbortController for
    // fetch supersession. Verbatim mirror of vue3.
    const asyncAbortControllerByKey = new Map<string, AbortController>();
    function abortAllAsyncControllers(): void {
      for (const controller of asyncAbortControllerByKey.values()) {
        try {
          controller.abort();
        } catch {
          // ignore
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
      if (cached != null) return;
      const requestId = nextAsyncRequestId++;
      const newRequestMap = new Map(asyncRequestIdByKey.value);
      newRequestMap.set(key, requestId);
      asyncRequestIdByKey.value = newRequestMap;
      const newResultMap = new Map(asyncValueResultsByKey.value);
      newResultMap.set(key, 'loading');
      asyncValueResultsByKey.value = newResultMap;
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
      const detected = typeaheadSlotDetected.value;
      let items: TypeaheadItem[];
      if (detected.slot === 'column') {
        items = props.columns.map((c) => ({
          kind: 'column' as const,
          colId: c.id,
          label: c.headerName ?? c.id,
        }));
      } else if (detected.slot === 'operator') {
        // (2026-06-01 — vue2 port): operator subset by
        // column type. Verbatim mirror of vue3.
        // + 100.2.3.2 (2026-06-01 — vue2 port): consumer
        // override dict + localized labels. Verbatim mirror of vue3.
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
        // + 100.2.2.1 + 100.2.2.4 (2026-06-01 — vue2
        // port): value slot pipeline; async getter wins over rows
        // (Decision R.1); inside-open-literal context filters to
        // string-kind values only. Verbatim mirror of vue3.
        const colId = detected.prevColumn;
        if (colId == null) return [];
        const column = props.columns.find((c) => c.id === colId);
        if (column == null) return [];
        let valueSourceList: readonly ColumnUniqueValue[];
        if (props.advancedFilterValueGetter != null) {
          const asyncKey = `${colId}::${typeaheadQuery.value}`;
          const cachedAsync = asyncValueResultsByKey.value.get(asyncKey);
          if (cachedAsync == null || cachedAsync === 'loading' || cachedAsync === 'error') {
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
        const filteredValueList = typeaheadInsideStringLiteral.value
          ? valueSourceList.filter((v) => typeof v.value === 'string')
          : valueSourceList;
        items = filteredValueList.map((v) => {
          const formatted = formatValueAsDsl(v.value);
          // (2026-06-01 — vue2 port): date formatter
          // displayText (verbatim mirror of vue3).
          let displayText: string | undefined;
          if (
            column.type === 'date' &&
            props.formatTypeaheadDateValue != null &&
            formatted.valueKind === 'string'
          ) {
            const isoBare = formatted.text.slice(1, -1);
            displayText = `"${props.formatTypeaheadDateValue(isoBare)}"`;
          }
          // (2026-06-01 — vue2 port): histogram count
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
      // (2026-06-01 — vue2 port): recent overlay
      // (Decision O.1). (2026-06-02 — vue2 port): scope by
      // colId for value slots when `typeaheadRecentScope === 'per-
      // column-value'`.
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
      return filterAutocompleteItems<TypeaheadItem>({
        items: itemsWithRecent,
        query: typeaheadQuery.value,
        getText: (i) => (i.kind === 'column' ? `${i.colId} ${i.label}` : i.text),
      });
    });

    // (2026-06-01 — vue2 port): async placeholder
    // computed. Verbatim mirror of vue3.
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

    // (2026-06-01 — vue2 port): extracted typeahead
    // trigger helper. Verbatim mirror of vue3 (allowEmptyWord opt-in
    // for post-commit path).
    function triggerTypeaheadAt(value: string, cursorPos: number, allowEmptyWord = false): void {
      advancedFilterText.value = value;
      const extracted = extractWordAtCursor(value, cursorPos);
      const detected = detectTypeaheadSlot(value, cursorPos);
      // (2026-06-01 — vue2 port): allow value-slot
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
      typeaheadSlotDetected.value = detected;
      typeaheadInsideStringLiteral.value = extracted.isInsideStringLiteral;
      typeaheadQuery.value = extracted.word;
      typeaheadWordRange.value = { start: extracted.start, end: extracted.end };
      typeaheadOpen.value = true;
      refreshTypeaheadAnchor();
      // (2026-06-01 — vue2 port): fire async getter.
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
      // (2026-06-01 — vue2 port): inside open string
      // literal context, insert bare-value + closing `"`. Verbatim
      // mirror of vue3.
      let insertText: string;
      if (
        active.item.kind === 'value' &&
        typeaheadInsideStringLiteral.value &&
        active.item.valueKind === 'string'
      ) {
        insertText = active.item.text.slice(1);
      } else {
        insertText = active.item.kind === 'column' ? active.item.colId : active.item.text;
      }
      const nextText = text.slice(0, wordRange.start) + insertText + text.slice(wordRange.end);
      const newCursorPos = wordRange.start + insertText.length;
      // (2026-06-01 — vue2 port): auto-trigger on non-
      // value commits. Verbatim mirror of vue3.
      const shouldAutoTrigger = active.item.kind !== 'value';
      const finalText = shouldAutoTrigger
        ? nextText.slice(0, newCursorPos) + ' ' + nextText.slice(newCursorPos)
        : nextText;
      const finalCursorPos = shouldAutoTrigger ? newCursorPos + 1 : newCursorPos;
      // (2026-06-01 — vue2 port): push to recent ring.
      // (2026-06-02 — vue2 port): per-column scope for
      // value commits when `typeaheadRecentScope === 'per-column-value'`.
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

    // (2026-06-01 — vue2 port): scroll-into-view watcher
    // on typeaheadActiveIdx. Verbatim mirror of vue3.
    watch(
      typeaheadActiveIdx,
      (idx) => {
        if (idx < 0) return;
        const listbox = typeaheadPopoverRef.value;
        if (listbox == null) return;
        const activeEl = listbox.querySelector<HTMLElement>(`[data-typeahead-item-index="${idx}"]`);
        if (activeEl == null) return;
        // Defensive guard: skip when scrollIntoView is unavailable.
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
              class: 'cx-table-filters-tool-panel__clear-all',
              attrs: {
                type: 'button',
                'data-testid': 'cx-filters-tool-panel-clear-all',
              },
              on: { click: clearAll },
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
                      attrs: { 'data-tool-panel-chip-index': String(chip.index) },
                    },
                    [
                      h('span', { class: 'cx-table-filters-tool-panel__chip-label' }, chip.label),
                      h(
                        'button',
                        {
                          class: 'cx-table-filters-tool-panel__chip-close',
                          attrs: {
                            type: 'button',
                            'aria-label': '移除该筛选',
                            'data-testid': `cx-filters-tool-panel-chip-close-${chip.index}`,
                          },
                          on: { click: () => removeFilterAt(chip.index) },
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
              ref: ((el: HTMLTextAreaElement | null) => {
                textareaRef.value = el;
              }) as never,
              class: 'cx-table-filters-tool-panel__textarea',
              attrs: {
                rows: 3,
                placeholder: '如 name contains "foo" and qty > 10',
                'data-testid': 'cx-filters-tool-panel-advanced-textarea',
                role: 'combobox',
                'aria-autocomplete': 'list',
                'aria-expanded': typeaheadOpen.value ? 'true' : 'false',
                'aria-controls': 'cx-filters-typeahead-listbox',
                'aria-activedescendant':
                  typeaheadOpen.value && typeaheadActiveIdx.value >= 0
                    ? `cx-filters-typeahead-item-${typeaheadActiveIdx.value}`
                    : undefined,
              },
              domProps: { value: advancedFilterText.value },
              on: {
                input: onTextareaInput,
                keydown: onTextareaKeydown,
              },
            }),
            h(
              'button',
              {
                class: 'cx-table-filters-tool-panel__apply',
                attrs: {
                  type: 'button',
                  'data-testid': 'cx-filters-tool-panel-advanced-apply',
                },
                on: { click: applyAdvancedFilter },
              },
              '应用',
            ),
            parseErrors.value.length > 0
              ? h(
                  'ul',
                  {
                    class: 'cx-table-filters-tool-panel__errors',
                    attrs: { 'data-testid': 'cx-filters-tool-panel-errors' },
                  },
                  parseErrors.value.map((err, i) => h('li', { key: i }, err.message)),
                )
              : null,
          ]),
        ]),
        typeaheadOpen.value &&
        (typeaheadMatches.value.length > 0 || asyncPlaceholderState.value != null) &&
        typeaheadAnchorRect.value != null
          ? h(
              'ul',
              {
                ref: ((el: HTMLElement | null) => {
                  typeaheadPopoverRef.value = el;
                }) as never,
                attrs: {
                  id: 'cx-filters-typeahead-listbox',
                  role: 'listbox',
                  'data-testid': 'cx-filters-typeahead',
                },
                class: 'cx-filters-typeahead',
                style: {
                  position: 'fixed',
                  left: `${typeaheadAnchorRect.value.left}px`,
                  top: `${typeaheadAnchorRect.value.bottom + 4}px`,
                  width: `${Math.min(280, typeaheadAnchorRect.value.width)}px`,
                  maxHeight: '240px',
                  overflowY: 'auto',
                  margin: '0',
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
                        attrs: {
                          'data-testid':
                            asyncPlaceholderState.value === 'loading'
                              ? 'cx-filters-typeahead-loading'
                              : 'cx-filters-typeahead-error',
                        },
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
                    // + 100.2.3.2 (2026-06-01 — vue2 port):
                    // displayText override for value / operator items.
                    // Verbatim mirror of vue3.
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
                        attrs: {
                          id: `cx-filters-typeahead-item-${idx}`,
                          role: 'option',
                          'aria-selected': isActive ? 'true' : 'false',
                          'data-testid': 'cx-filters-typeahead-item',
                          'data-typeahead-item-index': String(idx),
                          'data-typeahead-item-kind': match.item.kind,
                        },
                        class: `cx-filters-typeahead-item${isActive ? ' cx-filters-typeahead-item--active' : ''}`,
                        style: {
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          background: isActive ? '#eff6ff' : 'transparent',
                        },
                        on: {
                          click: () => {
                            typeaheadActiveIdx.value = idx;
                            commitTypeaheadSelection();
                          },
                        },
                      },
                      [
                        h('span', {}, renderMatchLabel(displayLabel, typeaheadQuery.value)),
                        // (2026-06-01 — vue2 port): recent
                        // badge. Verbatim mirror of vue3.
                        match.item.recent === true
                          ? h(
                              'span',
                              {
                                class: 'cx-filters-typeahead-item__recent',
                                attrs: {
                                  'data-testid': 'cx-filters-typeahead-item-recent',
                                },
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
                        // (2026-06-01 — vue2 port): count
                        // badge for value items. Verbatim mirror of vue3.
                        match.item.kind === 'value' && match.item.count != null
                          ? h(
                              'span',
                              {
                                class: 'cx-filters-typeahead-item__count',
                                attrs: {
                                  'data-testid': 'cx-filters-typeahead-item-count',
                                },
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
