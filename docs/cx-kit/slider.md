# Slider

Headless slider primitives for building custom slider components. Pure functions handle value computation, position mapping, and keyboard interaction — you control the rendering.

## Install

```bash
pnpm add @chronixjs/cx-kit
```

## Overview

Three pure functions:

- **`computeSliderValueAtPosition`** — map a pixel position on the track to a value
- **`computeSliderPositionForValue`** — map a value to a pixel position on the track
- **`computeSliderValueOnKey`** — compute the next value for a keyboard event

```ts
import {
  computeSliderValueAtPosition,
  computeSliderPositionForValue,
  computeSliderValueOnKey,
} from '@chronixjs/cx-kit';
```

## Basic Usage

### Value from Position

Compute the slider value from a pointer position on the track:

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

### Position from Value

Compute where to place the thumb for a given value:

```ts
const position = computeSliderPositionForValue({
  value: 75,
  min: 0,
  max: 100,
  trackSizePx: 300,
});
// position → 225
```

### Keyboard Navigation

Compute the next value when a key is pressed. Supports `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `PageUp`, `PageDown`:

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

Returns `null` if the key is not recognized.

### Page Steps

`PageUp` and `PageDown` jump by `step * largeStepMultiplier` (default multiplier is 10):

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

## Framework Examples

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

## API Reference

### `computeSliderValueAtPosition(input)`

Maps a pixel position to a snapped slider value.

| Property      | Type     | Default | Description                      |
| ------------- | -------- | ------- | -------------------------------- |
| `positionPx`  | `number` | —       | Pointer position along the track |
| `trackSizePx` | `number` | —       | Total track width in pixels      |
| `min`         | `number` | —       | Minimum value                    |
| `max`         | `number` | —       | Maximum value                    |
| `step`        | `number` | —       | Step increment                   |

**Returns:** `number` — the snapped value, clamped to `[min, max]`.

---

### `computeSliderPositionForValue(input)`

Maps a slider value to a pixel position on the track.

| Property      | Type     | Default | Description                 |
| ------------- | -------- | ------- | --------------------------- |
| `value`       | `number` | —       | Current slider value        |
| `min`         | `number` | —       | Minimum value               |
| `max`         | `number` | —       | Maximum value               |
| `trackSizePx` | `number` | —       | Total track width in pixels |

**Returns:** `number` — pixel position along the track.

---

### `computeSliderValueOnKey(input)`

Computes the next value for a keyboard event.

| Property              | Type     | Default | Description                    |
| --------------------- | -------- | ------- | ------------------------------ |
| `key`                 | `string` | —       | Keyboard key (`e.key`)         |
| `currentValue`        | `number` | —       | Current slider value           |
| `min`                 | `number` | —       | Minimum value                  |
| `max`                 | `number` | —       | Maximum value                  |
| `step`                | `number` | —       | Step increment                 |
| `largeStepMultiplier` | `number` | `10`    | Multiplier for PageUp/PageDown |

**Returns:** `number | null` — the next value, or `null` if the key is not recognized.

#### Supported Keys

| Key          | Action                           |
| ------------ | -------------------------------- |
| `ArrowRight` | Step up                          |
| `ArrowUp`    | Step up                          |
| `ArrowLeft`  | Step down                        |
| `ArrowDown`  | Step down                        |
| `PageUp`     | Jump up by `step × multiplier`   |
| `PageDown`   | Jump down by `step × multiplier` |
| `Home`       | Set to `min`                     |
| `End`        | Set to `max`                     |
