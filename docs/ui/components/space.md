# Space 间距

一维布局原语，用于元素间的一致间距。

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
  <CxSpace>
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script setup lang="ts">
import { CxSpace, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSpace>
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script>
import { CxSpace, CxButton } from '@chronixjs/ui-vue2';
export default {
  components: { CxSpace, CxButton },
};
</script>
```

```tsx [React]
import { CxSpace, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxSpace>
      <CxButton>Button 1</CxButton>
      <CxButton>Button 2</CxButton>
      <CxButton>Button 3</CxButton>
    </CxSpace>
  );
}
```

:::

## 垂直布局

使用 `vertical` 属性垂直排列子元素。

::: code-group

```vue [Vue 3]
<template>
  <CxSpace vertical>
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script setup lang="ts">
import { CxSpace, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSpace vertical>
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script>
import { CxSpace, CxButton } from '@chronixjs/ui-vue2';
export default {
  components: { CxSpace, CxButton },
};
</script>
```

```tsx [React]
import { CxSpace, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxSpace vertical>
      <CxButton>Button 1</CxButton>
      <CxButton>Button 2</CxButton>
      <CxButton>Button 3</CxButton>
    </CxSpace>
  );
}
```

:::

## 尺寸

使用 `size` 属性设置预设尺寸：`small`、`medium`（默认）和 `large`。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <CxSpace size="small">
      <CxButton>Small</CxButton>
      <CxButton>Small</CxButton>
    </CxSpace>
    <CxSpace size="medium">
      <CxButton>Medium</CxButton>
      <CxButton>Medium</CxButton>
    </CxSpace>
    <CxSpace size="large">
      <CxButton>Large</CxButton>
      <CxButton>Large</CxButton>
    </CxSpace>
  </div>
</template>

<script setup lang="ts">
import { CxSpace, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <CxSpace size="small">
      <CxButton>Small</CxButton>
      <CxButton>Small</CxButton>
    </CxSpace>
    <CxSpace size="medium">
      <CxButton>Medium</CxButton>
      <CxButton>Medium</CxButton>
    </CxSpace>
    <CxSpace size="large">
      <CxButton>Large</CxButton>
      <CxButton>Large</CxButton>
    </CxSpace>
  </div>
</template>

<script>
import { CxSpace, CxButton } from '@chronixjs/ui-vue2';
export default {
  components: { CxSpace, CxButton },
};
</script>
```

```tsx [React]
import { CxSpace, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <CxSpace size="small">
        <CxButton>Small</CxButton>
        <CxButton>Small</CxButton>
      </CxSpace>
      <CxSpace size="medium">
        <CxButton>Medium</CxButton>
        <CxButton>Medium</CxButton>
      </CxSpace>
      <CxSpace size="large">
        <CxButton>Large</CxButton>
        <CxButton>Large</CxButton>
      </CxSpace>
    </div>
  );
}
```

:::

## 自定义间距

传入数字给 `size` 设置自定义像素间距。

::: code-group

```vue [Vue 3]
<template>
  <CxSpace :size="24">
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script setup lang="ts">
import { CxSpace, CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxSpace :size="24">
    <CxButton>Button 1</CxButton>
    <CxButton>Button 2</CxButton>
    <CxButton>Button 3</CxButton>
  </CxSpace>
</template>

<script>
import { CxSpace, CxButton } from '@chronixjs/ui-vue2';
export default {
  components: { CxSpace, CxButton },
};
</script>
```

```tsx [React]
import { CxSpace, CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxSpace size={24}>
      <CxButton>Button 1</CxButton>
      <CxButton>Button 2</CxButton>
      <CxButton>Button 3</CxButton>
    </CxSpace>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性       | 类型                                                                                  | 默认值      | 说明           |
| ---------- | ------------------------------------------------------------------------------------- | ----------- | -------------- |
| `size`     | `'small' \| 'medium' \| 'large' \| number`                                            | `'medium'`  | 间距大小       |
| `vertical` | `boolean`                                                                             | `false`     | 垂直布局       |
| `wrap`     | `boolean`                                                                             | `true`      | 子元素换行     |
| `align`    | `'start' \| 'center' \| 'end' \| 'baseline' \| 'stretch'`                             | `undefined` | 交叉轴对齐     |
| `justify`  | `'start' \| 'center' \| 'end' \| 'space-around' \| 'space-between' \| 'space-evenly'` | `undefined` | 主轴对齐       |
| `inline`   | `boolean`                                                                             | `false`     | 行内 flex 模式 |
