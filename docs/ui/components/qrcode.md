# QR Code

QR code SVG rendering (requires optional `qrcode-generator` peer dependency).

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
  <CxQrCode value="https://chronixjs.dev" :size="200" />
</template>

<script setup lang="ts">
import { CxQrCode } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxQrCode value="https://chronixjs.dev" :size="200" />
</template>

<script>
import { CxQrCode } from '@chronixjs/ui-vue2';
export default { components: { CxQrCode } };
</script>
```

```tsx [React]
import { CxQrCode } from '@chronixjs/ui-react';

export function App() {
  return <CxQrCode value="https://chronixjs.dev" size={200} />;
}
```

:::

## Custom Colors

::: code-group

```vue [Vue 3]
<template>
  <CxQrCode
    value="https://chronixjs.dev"
    :size="160"
    foreground="#3b82f6"
    background="#f0f9ff"
    error-correction-level="H"
  />
</template>

<script setup lang="ts">
import { CxQrCode } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxQrCode
    value="https://chronixjs.dev"
    :size="160"
    foreground="#3b82f6"
    background="#f0f9ff"
    error-correction-level="H"
  />
</template>

<script>
import { CxQrCode } from '@chronixjs/ui-vue2';
export default { components: { CxQrCode } };
</script>
```

```tsx [React]
import { CxQrCode } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxQrCode
      value="https://chronixjs.dev"
      size={160}
      foreground="#3b82f6"
      background="#f0f9ff"
      errorCorrectionLevel="H"
    />
  );
}
```

:::

## API Reference

### Props

| Prop                   | Type                       | Default     | Description                     |
| ---------------------- | -------------------------- | ----------- | ------------------------------- |
| `value`                | `string`                   | `''`        | Value to encode                 |
| `size`                 | `number`                   | `200`       | Square render size in px        |
| `errorCorrectionLevel` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'`       | Error correction level          |
| `foreground`           | `string`                   | `'#000000'` | Dark module color               |
| `background`           | `string`                   | `'#ffffff'` | Light module / background color |
