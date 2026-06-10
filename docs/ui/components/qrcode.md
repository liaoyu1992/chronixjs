# QR Code 二维码

二维码 SVG 渲染（需要可选的对等依赖 `qrcode-generator`）。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

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

## 自定义颜色

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

## API 参考

### 属性 (Props)

| 属性                   | 类型                       | 默认值      | 说明                 |
| ---------------------- | -------------------------- | ----------- | -------------------- |
| `value`                | `string`                   | `''`        | 要编码的值           |
| `size`                 | `number`                   | `200`       | 正方形渲染尺寸（px） |
| `errorCorrectionLevel` | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'`       | 纠错等级             |
| `foreground`           | `string`                   | `'#000000'` | 深色模块颜色         |
| `background`           | `string`                   | `'#ffffff'` | 浅色模块 / 背景颜色  |
