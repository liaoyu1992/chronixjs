# Color Picker

Headless color picker primitives for HSV/RGB/HEX color manipulation and position mapping. Pure functions for color-space conversion and computing colors from UI positions (saturation/value square and hue strip).

## Install

```bash
pnpm add @chronixjs/cx-kit
```

## Overview

Two groups of functions:

**Color conversion:**

- `rgbToHsv` / `hsvToRgb` — convert between RGB and HSV color spaces
- `rgbToHex` / `hexToRgb` — convert between RGB and HEX strings

**Position mapping:**

- `computeHsvAtSquarePosition` — map a point on the saturation/value square to an HSV color
- `computeHueAtStripPosition` — map a point on the hue strip to a hue value
- `computeSquarePositionForHsv` — map an HSV color to a point on the saturation/value square
- `computeStripPositionForHue` — map a hue to a position on the hue strip

```ts
import {
  rgbToHsv,
  hsvToRgb,
  rgbToHex,
  hexToRgb,
  computeHsvAtSquarePosition,
  computeHueAtStripPosition,
  computeSquarePositionForHsv,
  computeStripPositionForHue,
} from '@chronixjs/cx-kit';
```

## Color Conversion

### RGB → HSV

```ts
import { rgbToHsv } from '@chronixjs/cx-kit';

const hsv = rgbToHsv({ r: 255, g: 128, b: 0 });
// hsv → { h: 30, s: 1, v: 1 }
```

### HSV → RGB

```ts
import { hsvToRgb } from '@chronixjs/cx-kit';

const rgb = hsvToRgb({ h: 30, s: 1, v: 1 });
// rgb → { r: 255, g: 128, b: 0 }
```

### RGB → HEX

```ts
import { rgbToHex } from '@chronixjs/cx-kit';

const hex = rgbToHex({ r: 255, g: 128, b: 0 });
// hex → '#ff8000'
```

### HEX → RGB

```ts
import { hexToRgb } from '@chronixjs/cx-kit';

const rgb = hexToRgb('#ff8000');
// rgb → { r: 255, g: 128, b: 0 }

const invalid = hexToRgb('not-a-color');
// invalid → null
```

## Position Mapping

### Color from Square Position

The saturation/value (SV) square maps X to saturation and Y to value:

```ts
import { computeHsvAtSquarePosition } from '@chronixjs/cx-kit';

const hsv = computeHsvAtSquarePosition({
  positionPxX: 128,
  positionPxY: 64,
  squareWidthPx: 256,
  squareHeightPx: 256,
  currentHue: 210,
});
// hsv → { h: 210, s: 0.5, v: 0.75 }
```

### Hue from Strip Position

The hue strip maps a vertical position to a hue (0–360):

```ts
import { computeHueAtStripPosition } from '@chronixjs/cx-kit';

const hue = computeHueAtStripPosition({
  positionPx: 128,
  stripSizePx: 256,
});
// hue → 180
```

### Square Position for HSV

Inverse mapping — given an HSV color, find where to place the indicator on the SV square:

```ts
import { computeSquarePositionForHsv } from '@chronixjs/cx-kit';

const pos = computeSquarePositionForHsv({
  hsv: { h: 210, s: 0.5, v: 0.75 },
  squareWidthPx: 256,
  squareHeightPx: 256,
});
// pos → { positionPxX: 128, positionPxY: 64 }
```

### Strip Position for Hue

Inverse mapping — given a hue, find where to place the indicator on the hue strip:

```ts
import { computeStripPositionForHue } from '@chronixjs/cx-kit';

const px = computeStripPositionForHue({
  hue: 180,
  stripSizePx: 256,
});
// px → 128
```

## Framework Examples

### Vue 3

```vue
<template>
  <div class="color-picker">
    <!-- SV Square -->
    <div
      ref="squareRef"
      class="sv-square"
      :style="{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }"
      @mousedown="onSquareDown"
    >
      <div class="sv-indicator" :style="{ left: svPos.x + 'px', top: svPos.y + 'px' }" />
    </div>

    <!-- Hue Strip -->
    <div ref="stripRef" class="hue-strip" @mousedown="onStripDown">
      <div class="hue-indicator" :style="{ top: stripPos + 'px' }" />
    </div>

    <!-- Output -->
    <div class="color-preview" :style="{ backgroundColor: hexColor }" />
    <span>{{ hexColor }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import {
  hsvToRgb,
  rgbToHex,
  computeHsvAtSquarePosition,
  computeHueAtStripPosition,
  computeSquarePositionForHsv,
  computeStripPositionForHue,
} from '@chronixjs/cx-kit';

const squareRef = ref<HTMLElement>();
const stripRef = ref<HTMLElement>();
const hsv = reactive({ h: 210, s: 0.5, v: 0.75 });

const squareSize = 256;
const stripSize = 256;

const svPos = computed(() =>
  computeSquarePositionForHsv({ hsv, squareWidthPx: squareSize, squareHeightPx: squareSize }),
);

const stripPos = computed(() => computeStripPositionForHue({ hue: hsv.h, stripSizePx: stripSize }));

const hexColor = computed(() => {
  const rgb = hsvToRgb(hsv);
  return rgbToHex(rgb);
});

function onSquareDown(e: MouseEvent) {
  const rect = squareRef.value!.getBoundingClientRect();
  const update = (ev: MouseEvent) => {
    const newHsv = computeHsvAtSquarePosition({
      positionPxX: ev.clientX - rect.left,
      positionPxY: ev.clientY - rect.top,
      squareWidthPx: rect.width,
      squareHeightPx: rect.height,
      currentHue: hsv.h,
    });
    hsv.s = newHsv.s;
    hsv.v = newHsv.v;
  };
  update(e);
  const up = () => {
    window.removeEventListener('mousemove', update);
    window.removeEventListener('mouseup', up);
  };
  window.addEventListener('mousemove', update);
  window.addEventListener('mouseup', up);
}

function onStripDown(e: MouseEvent) {
  const rect = stripRef.value!.getBoundingClientRect();
  const update = (ev: MouseEvent) => {
    hsv.h = computeHueAtStripPosition({
      positionPx: ev.clientY - rect.top,
      stripSizePx: rect.height,
    });
  };
  update(e);
  const up = () => {
    window.removeEventListener('mousemove', update);
    window.removeEventListener('mouseup', up);
  };
  window.addEventListener('mousemove', update);
  window.addEventListener('mouseup', up);
}
</script>

<style>
.color-picker {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.sv-square {
  width: 256px;
  height: 256px;
  position: relative;
  cursor: crosshair;
  background:
    linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent);
}
.sv-indicator {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}
.hue-strip {
  width: 24px;
  height: 256px;
  position: relative;
  cursor: pointer;
  background: linear-gradient(
    to bottom,
    hsl(0, 100%, 50%),
    hsl(60, 100%, 50%),
    hsl(120, 100%, 50%),
    hsl(180, 100%, 50%),
    hsl(240, 100%, 50%),
    hsl(300, 100%, 50%),
    hsl(360, 100%, 50%)
  );
}
.hue-indicator {
  position: absolute;
  width: 100%;
  height: 4px;
  background: #fff;
  border: 1px solid #000;
  transform: translateY(-50%);
}
.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
</style>
```

### React

```tsx
import { useRef, useState, useCallback } from 'react';
import {
  hsvToRgb,
  rgbToHex,
  computeHsvAtSquarePosition,
  computeHueAtStripPosition,
  computeSquarePositionForHsv,
  computeStripPositionForHue,
} from '@chronixjs/cx-kit';
import type { Hsv } from '@chronixjs/cx-kit';

const SQUARE = 256;
const STRIP = 256;

export function ColorPicker() {
  const squareRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [hsv, setHsv] = useState<Hsv>({ h: 210, s: 0.5, v: 0.75 });

  const rgb = hsvToRgb(hsv);
  const hex = rgbToHex(rgb);

  const svPos = computeSquarePositionForHsv({
    hsv,
    squareWidthPx: SQUARE,
    squareHeightPx: SQUARE,
  });
  const stripPx = computeStripPositionForHue({ hue: hsv.h, stripSizePx: STRIP });

  const onSquareDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = squareRef.current!.getBoundingClientRect();
      const update = (ev: MouseEvent) => {
        const newHsv = computeHsvAtSquarePosition({
          positionPxX: ev.clientX - rect.left,
          positionPxY: ev.clientY - rect.top,
          squareWidthPx: rect.width,
          squareHeightPx: rect.height,
          currentHue: hsv.h,
        });
        setHsv((prev) => ({ ...prev, s: newHsv.s, v: newHsv.v }));
      };
      update(e.nativeEvent);
      const up = () => {
        window.removeEventListener('mousemove', update);
        window.removeEventListener('mouseup', up);
      };
      window.addEventListener('mousemove', update);
      window.addEventListener('mouseup', up);
    },
    [hsv.h],
  );

  const onStripDown = useCallback((e: React.MouseEvent) => {
    const rect = stripRef.current!.getBoundingClientRect();
    const update = (ev: MouseEvent) => {
      const hue = computeHueAtStripPosition({
        positionPx: ev.clientY - rect.top,
        stripSizePx: rect.height,
      });
      setHsv((prev) => ({ ...prev, h: hue }));
    };
    update(e.nativeEvent);
    const up = () => {
      window.removeEventListener('mousemove', update);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', update);
    window.addEventListener('mouseup', up);
  }, []);

  return (
    <div className="color-picker">
      <div
        ref={squareRef}
        className="sv-square"
        style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
        onMouseDown={onSquareDown}
      >
        <div className="sv-indicator" style={{ left: svPos.positionPxX, top: svPos.positionPxY }} />
      </div>
      <div ref={stripRef} className="hue-strip" onMouseDown={onStripDown}>
        <div className="hue-indicator" style={{ top: stripPx }} />
      </div>
      <div className="color-preview" style={{ backgroundColor: hex }} />
      <span>{hex}</span>
    </div>
  );
}
```

## API Reference

### Color Conversion

#### `rgbToHsv(rgb)` / `hsvToRgb(hsv)`

Convert between RGB and HSV color spaces.

```ts
interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
} // 0–255
interface Hsv {
  readonly h: number;
  readonly s: number;
  readonly v: number;
} // h: 0–360, s/v: 0–1
```

#### `rgbToHex(rgb)`

Convert RGB to a hex string. **Returns:** `string` (e.g. `'#ff8000'`).

#### `hexToRgb(hex)`

Parse a hex string to RGB. **Returns:** `Rgb | null` — `null` if the string is invalid.

### Position Mapping

#### `computeHsvAtSquarePosition(input)`

Map a point on the SV square to an HSV color.

| Property         | Type     | Default | Description              |
| ---------------- | -------- | ------- | ------------------------ |
| `positionPxX`    | `number` | —       | X position on the square |
| `positionPxY`    | `number` | —       | Y position on the square |
| `squareWidthPx`  | `number` | —       | Square width in pixels   |
| `squareHeightPx` | `number` | —       | Square height in pixels  |
| `currentHue`     | `number` | —       | Current hue (0–360)      |

**Returns:** `Hsv`

#### `computeHueAtStripPosition(input)`

Map a point on the hue strip to a hue value.

| Property      | Type     | Default | Description              |
| ------------- | -------- | ------- | ------------------------ |
| `positionPx`  | `number` | —       | Position along the strip |
| `stripSizePx` | `number` | —       | Strip length in pixels   |

**Returns:** `number` — hue (0–360)

#### `computeSquarePositionForHsv(input)`

Map an HSV color to a point on the SV square.

| Property         | Type     | Default | Description             |
| ---------------- | -------- | ------- | ----------------------- |
| `hsv`            | `Hsv`    | —       | The HSV color           |
| `squareWidthPx`  | `number` | —       | Square width in pixels  |
| `squareHeightPx` | `number` | —       | Square height in pixels |

**Returns:** `{ positionPxX: number; positionPxY: number }`

#### `computeStripPositionForHue(input)`

Map a hue to a position on the hue strip.

| Property      | Type     | Default | Description            |
| ------------- | -------- | ------- | ---------------------- |
| `hue`         | `number` | —       | Hue value (0–360)      |
| `stripSizePx` | `number` | —       | Strip length in pixels |

**Returns:** `number` — position in pixels

### Types

```ts
interface Rgb {
  readonly r: number; // 0–255 integer
  readonly g: number;
  readonly b: number;
}

interface Hsv {
  readonly h: number; // 0–360 degrees
  readonly s: number; // 0–1 inclusive
  readonly v: number; // 0–1 inclusive
}

interface SquarePosition {
  readonly positionPxX: number;
  readonly positionPxY: number;
}
```
