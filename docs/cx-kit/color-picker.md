# 颜色选择器

用于 HSV/RGB/HEX 颜色操作和位置映射的无头颜色选择器原语。提供用于色彩空间转换以及从 UI 位置（饱和度/明度方块和色相条）计算颜色的纯函数。

## 安装

```bash
pnpm add @chronixjs/cx-kit
```

## 概述

两组函数：

**颜色转换：**

- `rgbToHsv` / `hsvToRgb` — 在 RGB 和 HSV 色彩空间之间转换
- `rgbToHex` / `hexToRgb` — 在 RGB 和 HEX 字符串之间转换

**位置映射：**

- `computeHsvAtSquarePosition` — 将饱和度/明度方块上的点映射为 HSV 颜色
- `computeHueAtStripPosition` — 将色相条上的点映射为色相值
- `computeSquarePositionForHsv` — 将 HSV 颜色映射为饱和度/明度方块上的点
- `computeStripPositionForHue` — 将色相映射为色相条上的位置

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

## 颜色转换

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

## 位置映射

### 从方块位置获取颜色

饱和度/明度 (SV) 方块将 X 映射到饱和度，Y 映射到明度：

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

### 从色条位置获取色相

色相条将垂直位置映射为色相值（0–360）：

```ts
import { computeHueAtStripPosition } from '@chronixjs/cx-kit';

const hue = computeHueAtStripPosition({
  positionPx: 128,
  stripSizePx: 256,
});
// hue → 180
```

### 根据 HSV 获取方块位置

反向映射 — 给定 HSV 颜色，找到指示器在 SV 方块上的位置：

```ts
import { computeSquarePositionForHsv } from '@chronixjs/cx-kit';

const pos = computeSquarePositionForHsv({
  hsv: { h: 210, s: 0.5, v: 0.75 },
  squareWidthPx: 256,
  squareHeightPx: 256,
});
// pos → { positionPxX: 128, positionPxY: 64 }
```

### 根据色相获取色条位置

反向映射 — 给定色相，找到指示器在色相条上的位置：

```ts
import { computeStripPositionForHue } from '@chronixjs/cx-kit';

const px = computeStripPositionForHue({
  hue: 180,
  stripSizePx: 256,
});
// px → 128
```

## 框架示例

### Vue 3

```vue
<template>
  <div class="color-picker">
    <!-- SV 方块 -->
    <div
      ref="squareRef"
      class="sv-square"
      :style="{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }"
      @mousedown="onSquareDown"
    >
      <div class="sv-indicator" :style="{ left: svPos.x + 'px', top: svPos.y + 'px' }" />
    </div>

    <!-- 色相条 -->
    <div ref="stripRef" class="hue-strip" @mousedown="onStripDown">
      <div class="hue-indicator" :style="{ top: stripPos + 'px' }" />
    </div>

    <!-- 输出 -->
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

## API 参考

### 颜色转换

#### `rgbToHsv(rgb)` / `hsvToRgb(hsv)`

在 RGB 和 HSV 色彩空间之间转换。

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

将 RGB 转换为十六进制字符串。**返回：** `string`（例如 `'#ff8000'`）。

#### `hexToRgb(hex)`

将十六进制字符串解析为 RGB。**返回：** `Rgb | null` — 如果字符串无效则返回 `null`。

### 位置映射

#### `computeHsvAtSquarePosition(input)`

将 SV 方块上的点映射为 HSV 颜色。

| 属性             | 类型     | 默认值 | 描述              |
| ---------------- | -------- | ------ | ----------------- |
| `positionPxX`    | `number` | —      | 方块上的 X 位置   |
| `positionPxY`    | `number` | —      | 方块上的 Y 位置   |
| `squareWidthPx`  | `number` | —      | 方块宽度（像素）  |
| `squareHeightPx` | `number` | —      | 方块高度（像素）  |
| `currentHue`     | `number` | —      | 当前色相（0–360） |

**返回：** `Hsv`

#### `computeHueAtStripPosition(input)`

将色相条上的点映射为色相值。

| 属性          | 类型     | 默认值 | 描述             |
| ------------- | -------- | ------ | ---------------- |
| `positionPx`  | `number` | —      | 沿色条的位置     |
| `stripSizePx` | `number` | —      | 色条长度（像素） |

**返回：** `number` — 色相值（0–360）

#### `computeSquarePositionForHsv(input)`

将 HSV 颜色映射为 SV 方块上的点。

| 属性             | 类型     | 默认值 | 描述             |
| ---------------- | -------- | ------ | ---------------- |
| `hsv`            | `Hsv`    | —      | HSV 颜色         |
| `squareWidthPx`  | `number` | —      | 方块宽度（像素） |
| `squareHeightPx` | `number` | —      | 方块高度（像素） |

**返回：** `{ positionPxX: number; positionPxY: number }`

#### `computeStripPositionForHue(input)`

将色相映射为色相条上的位置。

| 属性          | 类型     | 默认值 | 描述             |
| ------------- | -------- | ------ | ---------------- |
| `hue`         | `number` | —      | 色相值（0–360）  |
| `stripSizePx` | `number` | —      | 色条长度（像素） |

**返回：** `number` — 位置（像素）

### 类型

```ts
interface Rgb {
  readonly r: number; // 0–255 整数
  readonly g: number;
  readonly b: number;
}

interface Hsv {
  readonly h: number; // 0–360 度
  readonly s: number; // 0–1 包含
  readonly v: number; // 0–1 包含
}

interface SquarePosition {
  readonly positionPxX: number;
  readonly positionPxY: number;
}
```
