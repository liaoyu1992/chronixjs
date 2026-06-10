# Input Range

Headless dual-handle range input primitive. Provides pure functions for computing which handle to drag, mapping positions to values, and handling keyboard events — maintaining the invariant `low <= high`.

## Install

```bash
pnpm add @chronixjs/cx-kit
```

## Overview

Three pure functions:

- **`computeRangeClosestHandle`** — determine which handle is closest to a click position
- **`computeRangeValueAtPosition`** — map a pixel position to a `RangeValue`, updating only the active handle
- **`computeRangeValueOnKey`** — compute the next `RangeValue` for a keyboard event

```ts
import {
  computeRangeClosestHandle,
  computeRangeValueAtPosition,
  computeRangeValueOnKey,
} from '@chronixjs/cx-kit';
```

## Core Concept

A `RangeValue` represents the two-handle state:

```ts
interface RangeValue {
  readonly low: number;
  readonly high: number;
}
```

The invariant `low <= high` is always maintained — the functions will swap values if needed.

## Basic Usage

### Choose the Active Handle

When the user clicks on the track, determine which handle to activate:

```ts
import { computeRangeClosestHandle } from '@chronixjs/cx-kit';

const handle = computeRangeClosestHandle({
  positionPx: 120,
  currentRange: { low: 20, high: 80 },
  trackSizePx: 300,
  min: 0,
  max: 100,
});
// handle → 'low' (click was closer to the low handle)
```

### Value from Position

Compute the new range when dragging a handle to a position:

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

### Keyboard Navigation

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

Returns `null` if the key is not recognized.

## Framework Examples

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

## API Reference

### `computeRangeClosestHandle(input)`

Determines which handle is nearest to a given pixel position.

| Property       | Type         | Default | Description                    |
| -------------- | ------------ | ------- | ------------------------------ |
| `positionPx`   | `number`     | —       | Click position along the track |
| `currentRange` | `RangeValue` | —       | Current `{ low, high }` values |
| `trackSizePx`  | `number`     | —       | Total track width in pixels    |
| `min`          | `number`     | —       | Minimum value                  |
| `max`          | `number`     | —       | Maximum value                  |

**Returns:** `'low' | 'high'`

---

### `computeRangeValueAtPosition(input)`

Computes the new `RangeValue` when a handle is dragged to a position.

| Property       | Type              | Default | Description                      |
| -------------- | ----------------- | ------- | -------------------------------- |
| `positionPx`   | `number`          | —       | Pointer position along the track |
| `activeHandle` | `'low' \| 'high'` | —       | Which handle is being dragged    |
| `currentRange` | `RangeValue`      | —       | Current `{ low, high }` values   |
| `trackSizePx`  | `number`          | —       | Total track width in pixels      |
| `min`          | `number`          | —       | Minimum value                    |
| `max`          | `number`          | —       | Maximum value                    |
| `step`         | `number`          | —       | Step increment                   |

**Returns:** `RangeValue` — updated `{ low, high }`, maintaining `low <= high`.

---

### `computeRangeValueOnKey(input)`

Computes the next `RangeValue` for a keyboard event.

| Property              | Type              | Default | Description                    |
| --------------------- | ----------------- | ------- | ------------------------------ |
| `key`                 | `string`          | —       | Keyboard key (`e.key`)         |
| `activeHandle`        | `'low' \| 'high'` | —       | Which handle has focus         |
| `currentRange`        | `RangeValue`      | —       | Current `{ low, high }` values |
| `min`                 | `number`          | —       | Minimum value                  |
| `max`                 | `number`          | —       | Maximum value                  |
| `step`                | `number`          | —       | Step increment                 |
| `largeStepMultiplier` | `number`          | `10`    | Multiplier for PageUp/PageDown |

**Returns:** `RangeValue | null` — updated range, or `null` if key is not recognized.

### Types

```ts
type RangeHandle = 'low' | 'high';

interface RangeValue {
  readonly low: number;
  readonly high: number;
}
```
