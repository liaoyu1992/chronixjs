# Autocomplete

Headless autocomplete primitive for type-ahead search with match highlighting. Pure function that filters and ranks items, returning match spans for highlighting.

## Install

```bash
pnpm add @chronixjs/cx-kit
```

## Overview

Two pure functions:

- **`filterAutocompleteItems`** — filter and rank items by query, with match spans for highlighting
- **`computeMatchSpans`** — compute highlight spans for arbitrary text/query pairs

```ts
import { filterAutocompleteItems, computeMatchSpans } from '@chronixjs/cx-kit';
```

## Basic Usage

### Filter Items

```ts
import { filterAutocompleteItems } from '@chronixjs/cx-kit';

interface Fruit {
  id: number;
  name: string;
}

const fruits: Fruit[] = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Apricot' },
  { id: 4, name: 'Blueberry' },
];

const matches = filterAutocompleteItems({
  items: fruits,
  query: 'ap',
  getText: (item) => item.name,
  matchMode: 'prefix',
});

// matches → [
//   { item: { id: 1, name: 'Apple' },  score: 0, matchSpans: [{ start: 0, end: 2 }] },
//   { item: { id: 3, name: 'Apricot' }, score: 0, matchSpans: [{ start: 0, end: 2 }] },
// ]
```

### Match Modes

**Prefix** — matches items where the text starts with the query:

```ts
const prefixMatches = filterAutocompleteItems({
  items: fruits,
  query: 'ap',
  getText: (item) => item.name,
  matchMode: 'prefix', // default
});
// Apple, Apricot
```

**Substring** — matches items where the query appears anywhere:

```ts
const substringMatches = filterAutocompleteItems({
  items: fruits,
  query: 'an',
  getText: (item) => item.name,
  matchMode: 'substring',
});
// Banana
```

### Compute Match Spans

Use `computeMatchSpans` to get highlight ranges for any text/query pair:

```ts
import { computeMatchSpans } from '@chronixjs/cx-kit';

const spans = computeMatchSpans('Blueberry', 'berry', 'substring');
// spans → [{ start: 4, end: 9 }]
```

## Rendering Highlights

Use `matchSpans` to highlight matched portions in your UI:

### Vue 3

```vue
<template>
  <div>
    <input v-model="query" placeholder="Search fruits..." />
    <ul v-if="matches.length">
      <li v-for="match in matches" :key="match.item.id">
        <template v-for="(seg, i) in getSegments(match)" :key="i">
          <mark v-if="seg.highlight">{{ seg.text }}</mark>
          <span v-else>{{ seg.text }}</span>
        </template>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { filterAutocompleteItems } from '@chronixjs/cx-kit';

interface Fruit {
  id: number;
  name: string;
}

const fruits: Fruit[] = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Apricot' },
  { id: 4, name: 'Blueberry' },
  { id: 5, name: 'Cherry' },
];

const query = ref('');

const matches = computed(() =>
  query.value
    ? filterAutocompleteItems({
        items: fruits,
        query: query.value,
        getText: (item) => item.name,
        matchMode: 'substring',
      })
    : [],
);

interface Segment {
  text: string;
  highlight: boolean;
}

function getSegments(match: {
  item: Fruit;
  matchSpans: readonly { start: number; end: number }[];
}): Segment[] {
  const text = match.item.name;
  const segments: Segment[] = [];
  let pos = 0;
  for (const span of match.matchSpans) {
    if (span.start > pos) {
      segments.push({ text: text.slice(pos, span.start), highlight: false });
    }
    segments.push({ text: text.slice(span.start, span.end), highlight: true });
    pos = span.end;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos), highlight: false });
  }
  return segments;
}
</script>
```

### React

```tsx
import { useState, useMemo } from 'react';
import { filterAutocompleteItems } from '@chronixjs/cx-kit';
import type { AutocompleteMatch } from '@chronixjs/cx-kit';

interface Fruit {
  id: number;
  name: string;
}

const FRUITS: Fruit[] = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Apricot' },
  { id: 4, name: 'Blueberry' },
  { id: 5, name: 'Cherry' },
];

function renderMatch(match: AutocompleteMatch<Fruit>) {
  const text = match.item.name;
  const parts: React.ReactNode[] = [];
  let pos = 0;
  for (const span of match.matchSpans) {
    if (span.start > pos) {
      parts.push(text.slice(pos, span.start));
    }
    parts.push(<mark key={span.start}>{text.slice(span.start, span.end)}</mark>);
    pos = span.end;
  }
  if (pos < text.length) {
    parts.push(text.slice(pos));
  }
  return parts;
}

export function AutocompleteDemo() {
  const [query, setQuery] = useState('');

  const matches = useMemo(
    () =>
      query
        ? filterAutocompleteItems({
            items: FRUITS,
            query,
            getText: (item) => item.name,
            matchMode: 'substring',
          })
        : [],
    [query],
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search fruits..."
      />
      {matches.length > 0 && (
        <ul>
          {matches.map((match) => (
            <li key={match.item.id}>{renderMatch(match)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Async Data

Combine with async loading for server-side search:

```ts
import { ref, watch } from 'vue'; // or useState/useEffect in React
import { filterAutocompleteItems } from '@chronixjs/cx-kit';

// Example: debounce + async fetch
async function searchProducts(query: string) {
  // Fetch from API
  const response = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
  const products = await response.json();

  // Re-filter locally for match spans (server may not return spans)
  return filterAutocompleteItems({
    items: products,
    query,
    getText: (p) => p.name,
    matchMode: 'substring',
  });
}
```

## API Reference

### `filterAutocompleteItems<T>(input)`

Filters, ranks, and annotates items with match spans.

#### Input

| Property    | Type                      | Default    | Description                       |
| ----------- | ------------------------- | ---------- | --------------------------------- |
| `items`     | `readonly T[]`            | —          | The full list of items            |
| `query`     | `string`                  | —          | Search query                      |
| `getText`   | `(item: T) => string`     | —          | Extract searchable text from item |
| `matchMode` | `'prefix' \| 'substring'` | `'prefix'` | How to match the query            |

**Returns:** `readonly AutocompleteMatch<T>[]` — sorted by score (lower is better).

#### AutocompleteMatch

| Property     | Type                   | Description                      |
| ------------ | ---------------------- | -------------------------------- |
| `item`       | `T`                    | The original item                |
| `score`      | `number`               | Sort rank (lower = better match) |
| `matchSpans` | `readonly MatchSpan[]` | Ranges to highlight              |

#### MatchSpan

| Property | Type     | Description                          |
| -------- | -------- | ------------------------------------ |
| `start`  | `number` | Start index of the match (inclusive) |
| `end`    | `number` | End index of the match (exclusive)   |

---

### `computeMatchSpans(text, query, matchMode?)`

Compute highlight spans for any text/query pair.

| Parameter   | Type                      | Default       | Description       |
| ----------- | ------------------------- | ------------- | ----------------- |
| `text`      | `string`                  | —             | Text to search in |
| `query`     | `string`                  | —             | Query to find     |
| `matchMode` | `'prefix' \| 'substring'` | `'substring'` | Match mode        |

**Returns:** `readonly MatchSpan[]`

### Types

```ts
type AutocompleteMatchMode = 'prefix' | 'substring';

interface MatchSpan {
  readonly start: number;
  readonly end: number;
}

interface AutocompleteMatch<T> {
  readonly item: T;
  readonly score: number;
  readonly matchSpans: readonly MatchSpan[];
}
```
