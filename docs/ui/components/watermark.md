# Watermark 水印

重复叠加的水印，用于在内容上显示 DRAFT / CONFIDENTIAL / 用户 ID 等水印。

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

## 自定义样式

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

## API 参考

### 属性 (Props)

| 属性       | 类型     | 默认值        | 说明                 |
| ---------- | -------- | ------------- | -------------------- |
| `content`  | `string` | `'Watermark'` | 每个瓦片中的水印文本 |
| `width`    | `number` | `200`         | 瓦片宽度（像素）     |
| `height`   | `number` | `80`          | 瓦片高度（像素）     |
| `rotate`   | `number` | `-22`         | 旋转角度（度）       |
| `fontSize` | `number` | `16`          | 字体大小（像素）     |
| `color`    | `string` | `'#000000'`   | 水印文本的填充颜色   |
| `opacity`  | `number` | `0.15`        | 填充不透明度（0-1）  |

### 插槽 (Slots)

| 插槽      | 说明             |
| --------- | ---------------- |
| `default` | 被水印覆盖的内容 |
