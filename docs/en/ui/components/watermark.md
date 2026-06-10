# Watermark

Repeating overlay watermark for DRAFT / CONFIDENTIAL / user-ID watermarking on content.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

::: code-group

```vue [Vue 3]
<template>
  <CxWatermark content="DRAFT">
    <div style="height: 300px; padding: 24px;">
      <p>This content is watermarked.</p>
    </div>
  </CxWatermark>
</template>

<script setup lang="ts">
import { CxWatermark } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxWatermark content="DRAFT">
    <div style="height: 300px; padding: 24px;">
      <p>This content is watermarked.</p>
    </div>
  </CxWatermark>
</template>

<script>
import { CxWatermark } from '@chronixjs/ui-vue2';
export default { components: { CxWatermark } };
</script>
```

```tsx [React]
import { CxWatermark } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxWatermark content="DRAFT">
      <div style={{ height: 300, padding: 24 }}>
        <p>This content is watermarked.</p>
      </div>
    </CxWatermark>
  );
}
```

:::

## Custom Style

::: code-group

```vue [Vue 3]
<template>
  <CxWatermark
    content="CONFIDENTIAL"
    :font-size="20"
    :rotate="-30"
    :opacity="0.1"
    color="#ff0000"
    :width="240"
    :height="100"
  >
    <div style="height: 300px; padding: 24px;">
      <p>Sensitive information here.</p>
    </div>
  </CxWatermark>
</template>

<script setup lang="ts">
import { CxWatermark } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxWatermark
    content="CONFIDENTIAL"
    :font-size="20"
    :rotate="-30"
    :opacity="0.1"
    color="#ff0000"
    :width="240"
    :height="100"
  >
    <div style="height: 300px; padding: 24px;">
      <p>Sensitive information here.</p>
    </div>
  </CxWatermark>
</template>

<script>
import { CxWatermark } from '@chronixjs/ui-vue2';
export default { components: { CxWatermark } };
</script>
```

```tsx [React]
import { CxWatermark } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxWatermark
      content="CONFIDENTIAL"
      fontSize={20}
      rotate={-30}
      opacity={0.1}
      color="#ff0000"
      width={240}
      height={100}
    >
      <div style={{ height: 300, padding: 24 }}>
        <p>Sensitive information here.</p>
      </div>
    </CxWatermark>
  );
}
```

:::

## API Reference

### Props

| Prop       | Type     | Default       | Description                       |
| ---------- | -------- | ------------- | --------------------------------- |
| `content`  | `string` | `'Watermark'` | Watermark text in each tile       |
| `width`    | `number` | `200`         | Tile width in pixels              |
| `height`   | `number` | `80`          | Tile height in pixels             |
| `rotate`   | `number` | `-22`         | Rotation angle in degrees         |
| `fontSize` | `number` | `16`          | Font size in pixels               |
| `color`    | `string` | `'#000000'`   | Fill color for the watermark text |
| `opacity`  | `number` | `0.15`        | Fill opacity (0..1)               |

### Slots

| Slot      | Description                         |
| --------- | ----------------------------------- |
| `default` | Content to overlay the watermark on |
