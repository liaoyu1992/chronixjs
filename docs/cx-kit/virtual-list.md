# Virtual List

High-performance virtualized list for rendering large datasets. Only the items visible in the viewport (plus a small overscan buffer) are rendered, keeping DOM size constant regardless of data length.

## Install

```bash
pnpm add @chronixjs/cx-kit
```

## Overview

`computeVirtualWindow` is a **pure function** — given the current scroll position and viewport dimensions, it returns the slice of items to render and the CSS offsets needed to position them. It has no framework dependencies and no side effects.

```ts
import { computeVirtualWindow } from '@chronixjs/cx-kit';
```

## Basic Usage

```ts
import { computeVirtualWindow } from '@chronixjs/cx-kit';

const result = computeVirtualWindow({
  totalItemCount: 10000,
  itemHeightPx: 40,
  scrollTop: 800,
  viewportHeight: 600,
});

console.log(result);
// {
//   startIndex: 20,
//   endIndex: 35,
//   offsetTopPx: 800,
//   totalHeightPx: 400000,
// }
```

Then render only the items from `startIndex` to `endIndex`, positioned inside a container with `height: totalHeightPx` and the list offset by `offsetTopPx`.

## With Overscan

Add `overscan` to render extra items above and below the visible window, reducing blank flashes during fast scrolling:

```ts
const result = computeVirtualWindow({
  totalItemCount: 10000,
  itemHeightPx: 40,
  scrollTop: 800,
  viewportHeight: 600,
  overscan: 5, // render 5 extra items on each side
});
```

## Framework Examples

### Vue 3

```vue
<template>
  <div ref="viewportRef" class="virtual-list-viewport" @scroll="onScroll">
    <div class="virtual-list-spacer" :style="{ height: result.totalHeightPx + 'px' }">
      <div
        class="virtual-list-content"
        :style="{ transform: `translateY(${result.offsetTopPx}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="item.id"
          class="virtual-list-item"
          :style="{ height: itemHeightPx + 'px' }"
        >
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { computeVirtualWindow } from '@chronixjs/cx-kit';

const itemHeightPx = 40;
const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  label: `Item ${i}`,
}));

const viewportRef = ref<HTMLElement>();
const scrollTop = ref(0);

const result = computed(() =>
  computeVirtualWindow({
    totalItemCount: items.length,
    itemHeightPx,
    scrollTop: scrollTop.value,
    viewportHeight: viewportRef.value?.clientHeight ?? 600,
    overscan: 5,
  }),
);

const visibleItems = computed(() =>
  items.slice(result.value.startIndex, result.value.endIndex + 1),
);

function onScroll() {
  scrollTop.value = viewportRef.value?.scrollTop ?? 0;
}
</script>

<style>
.virtual-list-viewport {
  height: 600px;
  overflow-y: auto;
}
.virtual-list-spacer {
  position: relative;
}
.virtual-list-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
</style>
```

### Vue 2

```vue
<template>
  <div ref="viewportRef" class="virtual-list-viewport" @scroll="onScroll">
    <div class="virtual-list-spacer" :style="{ height: result.totalHeightPx + 'px' }">
      <div
        class="virtual-list-content"
        :style="{ transform: 'translateY(' + result.offsetTopPx + 'px)' }"
      >
        <div
          v-for="item in visibleItems"
          :key="item.id"
          class="virtual-list-item"
          :style="{ height: itemHeightPx + 'px' }"
        >
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computeVirtualWindow } from '@chronixjs/cx-kit';

export default {
  data() {
    const itemHeightPx = 40;
    const items = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      label: `Item ${i}`,
    }));
    return { items, itemHeightPx, scrollTop: 0 };
  },
  computed: {
    result() {
      const viewport = this.$refs.viewportRef;
      return computeVirtualWindow({
        totalItemCount: this.items.length,
        itemHeightPx: this.itemHeightPx,
        scrollTop: this.scrollTop,
        viewportHeight: viewport ? viewport.clientHeight : 600,
        overscan: 5,
      });
    },
    visibleItems() {
      return this.items.slice(this.result.startIndex, this.result.endIndex + 1);
    },
  },
  methods: {
    onScroll() {
      this.scrollTop = this.$refs.viewportRef?.scrollTop ?? 0;
    },
  },
};
</script>

<style>
.virtual-list-viewport {
  height: 600px;
  overflow-y: auto;
}
.virtual-list-spacer {
  position: relative;
}
.virtual-list-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
</style>
```

### React

```tsx
import { useRef, useState, useEffect, useMemo } from 'react';
import { computeVirtualWindow } from '@chronixjs/cx-kit';

interface Item {
  id: number;
  label: string;
}

const ITEM_HEIGHT = 40;
const ITEMS: Item[] = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  label: `Item ${i}`,
}));

export function VirtualList() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setViewportHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const result = useMemo(
    () =>
      computeVirtualWindow({
        totalItemCount: ITEMS.length,
        itemHeightPx: ITEM_HEIGHT,
        scrollTop,
        viewportHeight,
        overscan: 5,
      }),
    [scrollTop, viewportHeight],
  );

  const visibleItems = ITEMS.slice(result.startIndex, result.endIndex + 1);

  return (
    <div
      ref={viewportRef}
      className="virtual-list-viewport"
      onScroll={() => setScrollTop(viewportRef.current?.scrollTop ?? 0)}
    >
      <div className="virtual-list-spacer" style={{ height: result.totalHeightPx }}>
        <div
          className="virtual-list-content"
          style={{ transform: `translateY(${result.offsetTopPx}px)` }}
        >
          {visibleItems.map((item) => (
            <div key={item.id} className="virtual-list-item" style={{ height: ITEM_HEIGHT }}>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## API Reference

### `computeVirtualWindow(input)`

Returns the virtual window describing which items to render and how to position them.

#### Input

| Property         | Type     | Default | Description                         |
| ---------------- | -------- | ------- | ----------------------------------- |
| `totalItemCount` | `number` | —       | Total number of items in the list   |
| `itemHeightPx`   | `number` | —       | Fixed height of each item in pixels |
| `scrollTop`      | `number` | —       | Current scroll offset in pixels     |
| `viewportHeight` | `number` | —       | Visible viewport height in pixels   |
| `overscan`       | `number` | `3`     | Extra items to render above & below |

#### Output

| Property        | Type     | Description                                 |
| --------------- | -------- | ------------------------------------------- |
| `startIndex`    | `number` | Index of the first visible item (inclusive) |
| `endIndex`      | `number` | Index of the last visible item (inclusive)  |
| `offsetTopPx`   | `number` | Top offset for the rendered content (px)    |
| `totalHeightPx` | `number` | Total height of the full list (px)          |
