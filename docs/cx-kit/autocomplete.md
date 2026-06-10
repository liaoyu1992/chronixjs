# 自动补全

用于前置搜索和匹配高亮的无头自动补全原语。纯函数用于过滤和排序项，并返回匹配区间用于高亮显示。

## 安装

```bash
pnpm add @chronixjs/cx-kit
```

## 概述

两个纯函数：

- **`filterAutocompleteItems`** — 根据查询过滤和排序项，并返回匹配区间用于高亮
- **`computeMatchSpans`** — 为任意文本/查询对计算高亮区间

```ts
import { filterAutocompleteItems, computeMatchSpans } from '@chronixjs/cx-kit';
```

## 基本用法

### 过滤项

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

### 匹配模式

**前缀匹配（Prefix）** — 匹配文本以查询开头的项：

```ts
const prefixMatches = filterAutocompleteItems({
  items: fruits,
  query: 'ap',
  getText: (item) => item.name,
  matchMode: 'prefix', // 默认
});
// Apple, Apricot
```

**子串匹配（Substring）** — 匹配查询出现在任意位置的项：

```ts
const substringMatches = filterAutocompleteItems({
  items: fruits,
  query: 'an',
  getText: (item) => item.name,
  matchMode: 'substring',
});
// Banana
```

### 计算匹配区间

使用 `computeMatchSpans` 获取任意文本/查询对的高亮范围：

```ts
import { computeMatchSpans } from '@chronixjs/cx-kit';

const spans = computeMatchSpans('Blueberry', 'berry', 'substring');
// spans → [{ start: 4, end: 9 }]
```

## 渲染高亮

使用 `matchSpans` 在 UI 中高亮显示匹配的部分：

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

## 异步数据

结合异步加载实现服务端搜索：

```ts
import { ref, watch } from 'vue'; // 或 React 中的 useState/useEffect
import { filterAutocompleteItems } from '@chronixjs/cx-kit';

// 示例：防抖 + 异步获取
async function searchProducts(query: string) {
  // 从 API 获取数据
  const response = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
  const products = await response.json();

  // 在本地重新过滤以获取匹配区间（服务端可能不返回区间）
  return filterAutocompleteItems({
    items: products,
    query,
    getText: (p) => p.name,
    matchMode: 'substring',
  });
}
```

## API 参考

### `filterAutocompleteItems<T>(input)`

过滤、排序并为项添加匹配区间标注。

#### 输入

| 属性        | 类型                      | 默认值     | 描述                 |
| ----------- | ------------------------- | ---------- | -------------------- |
| `items`     | `readonly T[]`            | —          | 完整的项列表         |
| `query`     | `string`                  | —          | 搜索查询             |
| `getText`   | `(item: T) => string`     | —          | 从项中提取可搜索文本 |
| `matchMode` | `'prefix' \| 'substring'` | `'prefix'` | 匹配查询的方式       |

**返回：** `readonly AutocompleteMatch<T>[]` — 按 score 排序（越小越匹配）。

#### AutocompleteMatch

| 属性         | 类型                   | 描述                   |
| ------------ | ---------------------- | ---------------------- |
| `item`       | `T`                    | 原始项                 |
| `score`      | `number`               | 排序分数，越小匹配越好 |
| `matchSpans` | `readonly MatchSpan[]` | 需要高亮的范围         |

#### MatchSpan

| 属性    | 类型     | 描述                     |
| ------- | -------- | ------------------------ |
| `start` | `number` | 匹配的起始索引（包含）   |
| `end`   | `number` | 匹配的结束索引（不包含） |

---

### `computeMatchSpans(text, query, matchMode?)`

为任意文本/查询对计算高亮区间。

| 参数        | 类型                      | 默认值        | 描述         |
| ----------- | ------------------------- | ------------- | ------------ |
| `text`      | `string`                  | —             | 要搜索的文本 |
| `query`     | `string`                  | —             | 要查找的查询 |
| `matchMode` | `'prefix' \| 'substring'` | `'substring'` | 匹配模式     |

**返回：** `readonly MatchSpan[]`

### 类型

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
