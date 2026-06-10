# 虚拟列表

用于渲染大型数据集的高性能虚拟列表。仅渲染视口中可见的项（加上少量的预渲染缓冲），无论数据长度如何，DOM 大小始终保持恒定。

## 安装

```bash
pnpm add @chronixjs/cx-kit
```

## 概述

`computeVirtualWindow` 是一个**纯函数** — 给定当前滚动位置和视口尺寸，它返回需要渲染的项切片以及定位它们所需的 CSS 偏移量。它没有框架依赖，也没有副作用。

```ts
import { computeVirtualWindow } from '@chronixjs/cx-kit';
```

## 基本用法

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

然后仅渲染从 `startIndex` 到 `endIndex` 的项，将它们放置在一个高度为 `totalHeightPx` 的容器中，列表偏移量为 `offsetTopPx`。

## 预渲染（Overscan）

添加 `overscan` 以在可见窗口的上方和下方渲染额外的项，减少快速滚动时的空白闪烁：

```ts
const result = computeVirtualWindow({
  totalItemCount: 10000,
  itemHeightPx: 40,
  scrollTop: 800,
  viewportHeight: 600,
  overscan: 5, // 在每侧额外渲染 5 项
});
```

## 框架示例

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

## API 参考

### `computeVirtualWindow(input)`

返回描述需要渲染哪些项以及如何定位它们的虚拟窗口。

#### 输入

| 属性             | 类型     | 默认值 | 描述                     |
| ---------------- | -------- | ------ | ------------------------ |
| `totalItemCount` | `number` | —      | 列表中的总项数           |
| `itemHeightPx`   | `number` | —      | 每项的固定高度（像素）   |
| `scrollTop`      | `number` | —      | 当前滚动偏移量（像素）   |
| `viewportHeight` | `number` | —      | 可见视口高度（像素）     |
| `overscan`       | `number` | `3`    | 上方和下方额外渲染的项数 |

#### 输出

| 属性            | 类型     | 描述                         |
| --------------- | -------- | ---------------------------- |
| `startIndex`    | `number` | 第一个可见项的索引（包含）   |
| `endIndex`      | `number` | 最后一个可见项的索引（包含） |
| `offsetTopPx`   | `number` | 渲染内容的顶部偏移量（px）   |
| `totalHeightPx` | `number` | 完整列表的总高度（px）       |
