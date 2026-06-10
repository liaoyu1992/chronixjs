# 范围输入

无头双手柄范围输入原语。提供纯函数用于计算拖拽哪个手柄、将位置映射到值以及处理键盘事件 — 始终保持 `low <= high` 的不变量。

## 安装

```bash
pnpm add @chronixjs/cx-kit
```

## 概述

三个纯函数：

- **`computeRangeClosestHandle`** — 确定哪个手柄最接近点击位置
- **`computeRangeValueAtPosition`** — 将像素位置映射为 `RangeValue`，仅更新活动手柄
- **`computeRangeValueOnKey`** — 为键盘事件计算下一个 `RangeValue`

```ts
import {
  computeRangeClosestHandle,
  computeRangeValueAtPosition,
  computeRangeValueOnKey,
} from '@chronixjs/cx-kit';
```

## 核心概念

`RangeValue` 表示双手柄状态：

```ts
interface RangeValue {
  readonly low: number;
  readonly high: number;
}
```

始终维持 `low <= high` 的不变量 — 函数会在需要时交换值。

## 基本用法

### 选择活动手柄

当用户点击轨道时，确定激活哪个手柄：

```ts
import { computeRangeClosestHandle } from '@chronixjs/cx-kit';

const handle = computeRangeClosestHandle({
  positionPx: 120,
  currentRange: { low: 20, high: 80 },
  trackSizePx: 300,
  min: 0,
  max: 100,
});
// handle → 'low'（点击位置更接近 low 手柄）
```

### 从位置获取值

拖拽手柄到某个位置时计算新的范围：

```ts
import { computeRangeValueAtPosition } from '@chronixjs/cx-kit';

const newRange = computeRangeValueAtPosition({
  positionPx: 200,
  activeHandle: 'high',
  currentRange: { low: 20, high: 80 },
  trackSizePx: 300,
  min: 0,
  max: 100,
  step: 1,
});
// newRange → { low: 20, high: 67 }
```

### 键盘导航

```ts
import { computeRangeValueOnKey } from '@chronixjs/cx-kit';

const next = computeRangeValueOnKey({
  key: 'ArrowRight',
  activeHandle: 'low',
  currentRange: { low: 20, high: 80 },
  min: 0,
  max: 100,
  step: 5,
});
// next → { low: 25, high: 80 }
```

如果按键不被识别则返回 `null`。

## 框架示例

### Vue 3

```vue
<template>
  <div
    ref="trackRef"
    class="range-track"
    @mousedown="onMouseDown"
    @keydown="onKeyDown"
    tabindex="0"
    role="group"
  >
    <div class="range-fill" :style="{ left: posLow + 'px', width: posHigh - posLow + 'px' }" />
    <div
      class="range-thumb"
      :style="{ left: posLow + 'px' }"
      :class="{ active: activeHandle === 'low' }"
    />
    <div
      class="range-thumb"
      :style="{ left: posHigh + 'px' }"
      :class="{ active: activeHandle === 'high' }"
    />
  </div>
  <span>{{ range.low }} — {{ range.high }}</span>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  computeRangeClosestHandle,
  computeRangeValueAtPosition,
  computeRangeValueOnKey,
} from '@chronixjs/cx-kit';

const min = 0;
const max = 100;
const step = 1;
const trackRef = ref<HTMLElement>();
const range = ref({ low: 20, high: 80 });
const activeHandle = ref<'low' | 'high'>('low');

const trackSize = computed(() => trackRef.value?.clientWidth ?? 300);

const posLow = computed(() => ((range.value.low - min) / (max - min)) * trackSize.value);
const posHigh = computed(() => ((range.value.high - min) / (max - min)) * trackSize.value);

function onMouseDown(e: MouseEvent) {
  const track = trackRef.value!;
  const rect = track.getBoundingClientRect();
  const px = e.clientX - rect.left;

  activeHandle.value = computeRangeClosestHandle({
    positionPx: px,
    currentRange: range.value,
    trackSizePx: rect.width,
    min,
    max,
  });

  const onMove = (ev: MouseEvent) => {
    range.value = computeRangeValueAtPosition({
      positionPx: ev.clientX - rect.left,
      activeHandle: activeHandle.value,
      currentRange: range.value,
      trackSizePx: rect.width,
      min,
      max,
      step,
    });
  };
  onMove(e);
  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

function onKeyDown(e: KeyboardEvent) {
  const next = computeRangeValueOnKey({
    key: e.key,
    activeHandle: activeHandle.value,
    currentRange: range.value,
    min,
    max,
    step,
  });
  if (next !== null) {
    e.preventDefault();
    range.value = next;
  }
}
</script>

<style>
.range-track {
  position: relative;
  width: 300px;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
}
.range-fill {
  position: absolute;
  height: 100%;
  background: #4a90d9;
  border-radius: 4px;
}
.range-thumb {
  position: absolute;
  width: 16px;
  height: 16px;
  top: -4px;
  background: #fff;
  border: 2px solid #4a90d9;
  border-radius: 50%;
  transform: translateX(-50%);
}
.range-thumb.active {
  border-color: #1a5fb4;
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.3);
}
</style>
```

### React

```tsx
import { useRef, useState, useCallback } from 'react';
import {
  computeRangeClosestHandle,
  computeRangeValueAtPosition,
  computeRangeValueOnKey,
} from '@chronixjs/cx-kit';
import type { RangeHandle, RangeValue } from '@chronixjs/cx-kit';

const MIN = 0;
const MAX = 100;
const STEP = 1;

export function RangeSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState<RangeValue>({ low: 20, high: 80 });
  const [activeHandle, setActiveHandle] = useState<RangeHandle>('low');

  const trackWidth = trackRef.current?.clientWidth ?? 300;
  const posLow = ((range.low - MIN) / (MAX - MIN)) * trackWidth;
  const posHigh = ((range.high - MIN) / (MAX - MIN)) * trackWidth;

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const track = trackRef.current!;
      const rect = track.getBoundingClientRect();
      const px = e.clientX - rect.left;

      const handle = computeRangeClosestHandle({
        positionPx: px,
        currentRange: range,
        trackSizePx: rect.width,
        min: MIN,
        max: MAX,
      });
      setActiveHandle(handle);

      const onMove = (ev: MouseEvent) => {
        setRange((prev) =>
          computeRangeValueAtPosition({
            positionPx: ev.clientX - rect.left,
            activeHandle: handle,
            currentRange: prev,
            trackSizePx: rect.width,
            min: MIN,
            max: MAX,
            step: STEP,
          }),
        );
      };
      onMove(e.nativeEvent);
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [range],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const next = computeRangeValueOnKey({
        key: e.key,
        activeHandle,
        currentRange: range,
        min: MIN,
        max: MAX,
        step: STEP,
      });
      if (next !== null) {
        e.preventDefault();
        setRange(next);
      }
    },
    [activeHandle, range],
  );

  return (
    <>
      <div
        ref={trackRef}
        className="range-track"
        onMouseDown={onMouseDown}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="group"
      >
        <div className="range-fill" style={{ left: posLow, width: posHigh - posLow }} />
        <div className="range-thumb" style={{ left: posLow }} />
        <div className="range-thumb" style={{ left: posHigh }} />
      </div>
      <span>
        {range.low} — {range.high}
      </span>
    </>
  );
}
```

## API 参考

### `computeRangeClosestHandle(input)`

确定哪个手柄最接近给定的像素位置。

| 属性           | 类型         | 默认值 | 描述                      |
| -------------- | ------------ | ------ | ------------------------- |
| `positionPx`   | `number`     | —      | 沿轨道的点击位置          |
| `currentRange` | `RangeValue` | —      | 当前的 `{ low, high }` 值 |
| `trackSizePx`  | `number`     | —      | 轨道总宽度（像素）        |
| `min`          | `number`     | —      | 最小值                    |
| `max`          | `number`     | —      | 最大值                    |

**返回：** `'low' | 'high'`

---

### `computeRangeValueAtPosition(input)`

当手柄拖拽到某个位置时，计算新的 `RangeValue`。

| 属性           | 类型              | 默认值 | 描述                      |
| -------------- | ----------------- | ------ | ------------------------- |
| `positionPx`   | `number`          | —      | 沿轨道的指针位置          |
| `activeHandle` | `'low' \| 'high'` | —      | 正在拖拽的手柄            |
| `currentRange` | `RangeValue`      | —      | 当前的 `{ low, high }` 值 |
| `trackSizePx`  | `number`          | —      | 轨道总宽度（像素）        |
| `min`          | `number`          | —      | 最小值                    |
| `max`          | `number`          | —      | 最大值                    |
| `step`         | `number`          | —      | 步进增量                  |

**返回：** `RangeValue` — 更新后的 `{ low, high }`，维持 `low <= high`。

---

### `computeRangeValueOnKey(input)`

为键盘事件计算下一个 `RangeValue`。

| 属性                  | 类型              | 默认值 | 描述                      |
| --------------------- | ----------------- | ------ | ------------------------- |
| `key`                 | `string`          | —      | 键盘按键 (`e.key`)        |
| `activeHandle`        | `'low' \| 'high'` | —      | 获得焦点的手柄            |
| `currentRange`        | `RangeValue`      | —      | 当前的 `{ low, high }` 值 |
| `min`                 | `number`          | —      | 最小值                    |
| `max`                 | `number`          | —      | 最大值                    |
| `step`                | `number`          | —      | 步进增量                  |
| `largeStepMultiplier` | `number`          | `10`   | PageUp/PageDown 的乘数    |

**返回：** `RangeValue | null` — 更新后的范围，如果按键不被识别则返回 `null`。

### 类型

```ts
type RangeHandle = 'low' | 'high';

interface RangeValue {
  readonly low: number;
  readonly high: number;
}
```
