# 滑块

用于构建自定义滑块组件的无头滑块原语。纯函数处理值计算、位置映射和键盘交互 — 你完全控制渲染。

## 安装

```bash
pnpm add @chronixjs/cx-kit
```

## 概述

三个纯函数：

- **`computeSliderValueAtPosition`** — 将轨道上的像素位置映射到值
- **`computeSliderPositionForValue`** — 将值映射到轨道上的像素位置
- **`computeSliderValueOnKey`** — 为键盘事件计算下一个值

```ts
import {
  computeSliderValueAtPosition,
  computeSliderPositionForValue,
  computeSliderValueOnKey,
} from '@chronixjs/cx-kit';
```

## 基本用法

### 从位置获取值

根据轨道上的指针位置计算滑块值：

```ts
const value = computeSliderValueAtPosition({
  positionPx: 150,
  trackSizePx: 300,
  min: 0,
  max: 100,
  step: 1,
});
// value → 50
```

### 从值获取位置

计算给定值对应的滑块位置：

```ts
const position = computeSliderPositionForValue({
  value: 75,
  min: 0,
  max: 100,
  trackSizePx: 300,
});
// position → 225
```

### 键盘导航

按键时计算下一个值。支持 `ArrowUp`、`ArrowDown`、`ArrowLeft`、`ArrowRight`、`Home`、`End`、`PageUp`、`PageDown`：

```ts
const nextValue = computeSliderValueOnKey({
  key: 'ArrowRight',
  currentValue: 50,
  min: 0,
  max: 100,
  step: 5,
});
// nextValue → 55
```

如果按键不被识别则返回 `null`。

### Page 步进

`PageUp` 和 `PageDown` 按 `step * largeStepMultiplier` 跳跃（默认乘数为 10）：

```ts
const jumped = computeSliderValueOnKey({
  key: 'PageUp',
  currentValue: 50,
  min: 0,
  max: 100,
  step: 1,
  largeStepMultiplier: 10,
});
// jumped → 60
```

## 框架示例

### Vue 3

```vue
<template>
  <div
    ref="trackRef"
    class="slider-track"
    @mousedown="onMouseDown"
    @keydown="onKeyDown"
    tabindex="0"
    role="slider"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-valuenow="value"
  >
    <div class="slider-fill" :style="{ width: position + 'px' }" />
    <div class="slider-thumb" :style="{ left: position + 'px' }" />
  </div>
  <span>Value: {{ value }}</span>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  computeSliderValueAtPosition,
  computeSliderPositionForValue,
  computeSliderValueOnKey,
} from '@chronixjs/cx-kit';

const min = 0;
const max = 100;
const step = 1;

const trackRef = ref<HTMLElement>();
const value = ref(50);

const position = computed(() =>
  computeSliderPositionForValue({
    value: value.value,
    min,
    max,
    trackSizePx: trackRef.value?.clientWidth ?? 300,
  }),
);

function onMouseDown(e: MouseEvent) {
  const track = trackRef.value!;
  const onMove = (ev: MouseEvent) => {
    const rect = track.getBoundingClientRect();
    value.value = computeSliderValueAtPosition({
      positionPx: ev.clientX - rect.left,
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
  const next = computeSliderValueOnKey({
    key: e.key,
    currentValue: value.value,
    min,
    max,
    step,
  });
  if (next !== null) {
    e.preventDefault();
    value.value = next;
  }
}
</script>

<style>
.slider-track {
  position: relative;
  width: 300px;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
}
.slider-fill {
  position: absolute;
  height: 100%;
  background: #4a90d9;
  border-radius: 4px;
}
.slider-thumb {
  position: absolute;
  width: 16px;
  height: 16px;
  top: -4px;
  background: #fff;
  border: 2px solid #4a90d9;
  border-radius: 50%;
  transform: translateX(-50%);
}
</style>
```

### React

```tsx
import { useRef, useState, useCallback } from 'react';
import {
  computeSliderValueAtPosition,
  computeSliderPositionForValue,
  computeSliderValueOnKey,
} from '@chronixjs/cx-kit';

const MIN = 0;
const MAX = 100;
const STEP = 1;

export function Slider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(50);

  const position = computeSliderPositionForValue({
    value,
    min: MIN,
    max: MAX,
    trackSizePx: trackRef.current?.clientWidth ?? 300,
  });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const track = trackRef.current!;
    const onMove = (ev: MouseEvent) => {
      const rect = track.getBoundingClientRect();
      setValue(
        computeSliderValueAtPosition({
          positionPx: ev.clientX - rect.left,
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
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const next = computeSliderValueOnKey({
        key: e.key,
        currentValue: value,
        min: MIN,
        max: MAX,
        step: STEP,
      });
      if (next !== null) {
        e.preventDefault();
        setValue(next);
      }
    },
    [value],
  );

  return (
    <>
      <div
        ref={trackRef}
        className="slider-track"
        onMouseDown={onMouseDown}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="slider"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={value}
      >
        <div className="slider-fill" style={{ width: position }} />
        <div className="slider-thumb" style={{ left: position }} />
      </div>
      <span>Value: {value}</span>
    </>
  );
}
```

## API 参考

### `computeSliderValueAtPosition(input)`

将像素位置映射到对齐后的滑块值。

| 属性          | 类型     | 默认值 | 描述               |
| ------------- | -------- | ------ | ------------------ |
| `positionPx`  | `number` | —      | 沿轨道的指针位置   |
| `trackSizePx` | `number` | —      | 轨道总宽度（像素） |
| `min`         | `number` | —      | 最小值             |
| `max`         | `number` | —      | 最大值             |
| `step`        | `number` | —      | 步进增量           |

**返回：** `number` — 对齐后的值，限制在 `[min, max]` 范围内。

---

### `computeSliderPositionForValue(input)`

将滑块值映射到轨道上的像素位置。

| 属性          | 类型     | 默认值 | 描述               |
| ------------- | -------- | ------ | ------------------ |
| `value`       | `number` | —      | 当前滑块值         |
| `min`         | `number` | —      | 最小值             |
| `max`         | `number` | —      | 最大值             |
| `trackSizePx` | `number` | —      | 轨道总宽度（像素） |

**返回：** `number` — 沿轨道的像素位置。

---

### `computeSliderValueOnKey(input)`

为键盘事件计算下一个值。

| 属性                  | 类型     | 默认值 | 描述                   |
| --------------------- | -------- | ------ | ---------------------- |
| `key`                 | `string` | —      | 键盘按键 (`e.key`)     |
| `currentValue`        | `number` | —      | 当前滑块值             |
| `min`                 | `number` | —      | 最小值                 |
| `max`                 | `number` | —      | 最大值                 |
| `step`                | `number` | —      | 步进增量               |
| `largeStepMultiplier` | `number` | `10`   | PageUp/PageDown 的乘数 |

**返回：** `number | null` — 下一个值，如果按键不被识别则返回 `null`。

#### 支持的按键

| 按键         | 操作                            |
| ------------ | ------------------------------- |
| `ArrowRight` | 增加一步                        |
| `ArrowUp`    | 增加一步                        |
| `ArrowLeft`  | 减少一步                        |
| `ArrowDown`  | 减少一步                        |
| `PageUp`     | 按 `step × multiplier` 向上跳跃 |
| `PageDown`   | 按 `step × multiplier` 向下跳跃 |
| `Home`       | 设置为 `min`                    |
| `End`        | 设置为 `max`                    |
