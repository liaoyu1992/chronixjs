# CX Kit — 快速开始

CX Kit 提供无头原语，在内部处理复杂逻辑的同时，让你对渲染拥有最大控制权。

## 安装

```bash
pnpm add @chronixjs/cx-kit@alpha
```

## 设计理念

CX Kit 原语遵循**无头 UI** 模式：

1. **逻辑而非标记** — 处理状态、键盘导航、ARIA 属性和计算
2. **框架无关** — 纯 TypeScript，不依赖任何框架
3. **可组合** — 组合原语以构建复杂组件
4. **无障碍** — 内置 ARIA 角色和键盘支持

## 使用模式

每个原语导出一个 `create*` 工厂函数，返回响应式状态和操作：

```ts
import { createSlider } from '@chronixjs/cx-kit';

// 1. 创建原语实例
const slider = createSlider({
  min: 0,
  max: 100,
  step: 5,
  value: 30,
});

// 2. 读取状态
console.log(slider.getState().value); // 30

// 3. 订阅变更
slider.subscribe((state) => {
  console.log('New value:', state.value);
});

// 4. 派发操作
slider.setValue(75);
```

## 在 Vue 3 中使用

```vue
<template>
  <div ref="trackRef" class="slider-track" @mousedown="onMouseDown">
    <div class="slider-fill" :style="{ width: fillPercent + '%' }" />
    <div class="slider-thumb" :style="{ left: fillPercent + '%' }" />
  </div>
  <span>Value: {{ slider.getState().value }}</span>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { createSlider } from '@chronixjs/cx-kit';

const trackRef = ref<HTMLElement>();
const slider = createSlider({ min: 0, max: 100, value: 50 });

const fillPercent = computed(() => {
  const { value, min, max } = slider.getState();
  return ((value - min) / (max - min)) * 100;
});

function onMouseDown(e: MouseEvent) {
  // 使用滑块的指针处理
  slider.startInteraction(e.clientX);
}
</script>
```

## 在 React 中使用

```tsx
import { useRef, useState, useEffect } from 'react';
import { createSlider } from '@chronixjs/cx-kit';

export function MySlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [slider] = useState(() => createSlider({ min: 0, max: 100, value: 50 }));
  const [value, setValue] = useState(50);

  useEffect(() => {
    return slider.subscribe((state) => setValue(state.value));
  }, [slider]);

  const fillPercent = ((value - 0) / (100 - 0)) * 100;

  return (
    <>
      <div
        ref={trackRef}
        className="slider-track"
        onMouseDown={(e) => slider.startInteraction(e.clientX)}
      >
        <div className="slider-fill" style={{ width: `${fillPercent}%` }} />
        <div className="slider-thumb" style={{ left: `${fillPercent}%` }} />
      </div>
      <span>Value: {value}</span>
    </>
  );
}
```

## 下一步

- [虚拟列表](/cx-kit/virtual-list) — 高性能列表渲染
- [滑块](/cx-kit/slider) — 滑块原语
- [颜色选择器](/cx-kit/color-picker) — 颜色选择原语
- [自动补全](/cx-kit/autocomplete) — 前置搜索原语
