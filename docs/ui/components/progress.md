# Progress 进度条

带语义类型和可配置显示的线性进度条。

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
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="30" />
    <CxProgress :percentage="60" type="success" />
    <CxProgress :percentage="100" type="warning" />
  </div>
</template>

<script setup lang="ts">
import { CxProgress } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="30" />
    <CxProgress :percentage="60" type="success" />
    <CxProgress :percentage="100" type="warning" />
  </div>
</template>

<script>
import { CxProgress } from '@chronixjs/ui-vue2';

export default {
  components: { CxProgress },
};
</script>
```

```tsx [React]
import { CxProgress } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CxProgress percentage={30} />
      <CxProgress percentage={60} type="success" />
      <CxProgress percentage={100} type="warning" />
    </div>
  );
}
```

:::

## 进度条类型

使用 `type` 应用语义颜色：`default`、`success`、`warning`、`error` 或 `info`。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="20" type="default" />
    <CxProgress :percentage="40" type="success" />
    <CxProgress :percentage="60" type="warning" />
    <CxProgress :percentage="80" type="error" />
    <CxProgress :percentage="90" type="info" />
  </div>
</template>

<script setup lang="ts">
import { CxProgress } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="20" type="default" />
    <CxProgress :percentage="40" type="success" />
    <CxProgress :percentage="60" type="warning" />
    <CxProgress :percentage="80" type="error" />
    <CxProgress :percentage="90" type="info" />
  </div>
</template>

<script>
import { CxProgress } from '@chronixjs/ui-vue2';

export default {
  components: { CxProgress },
};
</script>
```

```tsx [React]
import { CxProgress } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CxProgress percentage={20} type="default" />
      <CxProgress percentage={40} type="success" />
      <CxProgress percentage={60} type="warning" />
      <CxProgress percentage={80} type="error" />
      <CxProgress percentage={90} type="info" />
    </div>
  );
}
```

:::

## 指示器位置

控制百分比文本出现的位置。默认情况下指示器放置在进度条**外部**。设置 `indicator-placement="inside"` 可将其渲染在填充区域内。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="70" indicator-placement="outside" />
    <CxProgress :percentage="70" indicator-placement="inside" :height="24" />
  </div>
</template>

<script setup lang="ts">
import { CxProgress } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="70" indicator-placement="outside" />
    <CxProgress :percentage="70" indicator-placement="inside" :height="24" />
  </div>
</template>

<script>
import { CxProgress } from '@chronixjs/ui-vue2';

export default {
  components: { CxProgress },
};
</script>
```

```tsx [React]
import { CxProgress } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CxProgress percentage={70} indicatorPlacement="outside" />
      <CxProgress percentage={70} indicatorPlacement="inside" height={24} />
    </div>
  );
}
```

:::

## 自定义高度

设置 `height` 属性（像素）来创建更粗或更细的进度条。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <CxProgress :percentage="50" :height="8" />
    <CxProgress :percentage="50" :height="16" />
    <CxProgress :percentage="50" :height="24" />
  </div>
</template>

<script setup lang="ts">
import { CxProgress } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <CxProgress :percentage="50" :height="8" />
    <CxProgress :percentage="50" :height="16" />
    <CxProgress :percentage="50" :height="24" />
  </div>
</template>

<script>
import { CxProgress } from '@chronixjs/ui-vue2';

export default {
  components: { CxProgress },
};
</script>
```

```tsx [React]
import { CxProgress } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CxProgress percentage={50} height={8} />
      <CxProgress percentage={50} height={16} />
      <CxProgress percentage={50} height={24} />
    </div>
  );
}
```

:::

## 隐藏百分比文本

设置 `show-info` 为 `false` 可隐藏百分比文本。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="40" :show-info="false" />
    <CxProgress :percentage="75" :show-info="false" type="success" />
  </div>
</template>

<script setup lang="ts">
import { CxProgress } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <CxProgress :percentage="40" :show-info="false" />
    <CxProgress :percentage="75" :show-info="false" type="success" />
  </div>
</template>

<script>
import { CxProgress } from '@chronixjs/ui-vue2';

export default {
  components: { CxProgress },
};
</script>
```

```tsx [React]
import { CxProgress } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CxProgress percentage={40} showInfo={false} />
      <CxProgress percentage={75} showInfo={false} type="success" />
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性                 | 类型                                                       | 默认值      | 说明            |
| -------------------- | ---------------------------------------------------------- | ----------- | --------------- |
| `type`               | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | 进度条类型      |
| `percentage`         | `number`                                                   | `0`         | 进度值（0-100） |
| `showInfo`           | `boolean`                                                  | `true`      | 显示百分比文本  |
| `height`             | `number`                                                   | `undefined` | 轨道高度（px）  |
| `indicatorPlacement` | `'inside' \| 'outside'`                                    | `'outside'` | 文本位置        |
