# CX Kit — Getting Started

CX Kit provides headless primitives that give you maximum control over rendering while handling complex logic internally.

## Install

```bash
pnpm add @chronixjs/cx-kit@alpha
```

## Philosophy

CX Kit primitives follow the **headless UI** pattern:

1. **Logic, not markup** — handles state, keyboard navigation, ARIA attributes, and calculations
2. **Framework-agnostic** — pure TypeScript with no framework dependencies
3. **Composable** — combine primitives to build complex components
4. **Accessible** — ARIA roles and keyboard support built in

## Usage Pattern

Each primitive exports a `create*` factory function that returns reactive state and actions:

```ts
import { createSlider } from '@chronixjs/cx-kit';

// 1. Create the primitive instance
const slider = createSlider({
  min: 0,
  max: 100,
  step: 5,
  value: 30,
});

// 2. Read state
console.log(slider.getState().value); // 30

// 3. Subscribe to changes
slider.subscribe((state) => {
  console.log('New value:', state.value);
});

// 4. Dispatch actions
slider.setValue(75);
```

## Using with Vue 3

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
  // Use the slider's pointer handling
  slider.startInteraction(e.clientX);
}
</script>
```

## Using with React

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

## Next Steps

- [Virtual List](/cx-kit/virtual-list) — high-performance list rendering
- [Slider](/cx-kit/slider) — slider primitive
- [Color Picker](/cx-kit/color-picker) — color selection primitive
- [Autocomplete](/cx-kit/autocomplete) — type-ahead search primitive
