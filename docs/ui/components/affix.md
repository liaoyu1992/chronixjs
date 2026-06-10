# Affix 固钉

当子元素的自然滚动位置超过顶部或底部阈值时，将其固定在视口中。

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
  <CxAffix :top="0">
    <div style="background: #fff; padding: 8px 16px;">Sticky Header</div>
  </CxAffix>
</template>

<script setup lang="ts">
import { CxAffix } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAffix :top="0">
    <div style="background: #fff; padding: 8px 16px;">Sticky Header</div>
  </CxAffix>
</template>

<script>
import { CxAffix } from '@chronixjs/ui-vue2';
export default { components: { CxAffix } };
</script>
```

```tsx [React]
import { CxAffix } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxAffix top={0}>
      <div style={{ background: '#fff', padding: '8px 16px' }}>Sticky Header</div>
    </CxAffix>
  );
}
```

:::

## 底部固定

::: code-group

```vue [Vue 3]
<template>
  <CxAffix :bottom="20">
    <div style="background: #fff; padding: 8px 16px;">Bottom Sticky</div>
  </CxAffix>
</template>

<script setup lang="ts">
import { CxAffix } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxAffix :bottom="20">
    <div style="background: #fff; padding: 8px 16px;">Bottom Sticky</div>
  </CxAffix>
</template>

<script>
import { CxAffix } from '@chronixjs/ui-vue2';
export default { components: { CxAffix } };
</script>
```

```tsx [React]
import { CxAffix } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxAffix bottom={20}>
      <div style={{ background: '#fff', padding: '8px 16px' }}>Bottom Sticky</div>
    </CxAffix>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性     | 类型                  | 默认值      | 说明                   |
| -------- | --------------------- | ----------- | ---------------------- |
| `top`    | `number \| undefined` | `undefined` | 固定时距视口顶部的距离 |
| `bottom` | `number \| undefined` | `undefined` | 固定时距视口底部的距离 |

### 事件 (Events)

| 事件     | 载荷      | 说明               |
| -------- | --------- | ------------------ |
| `change` | `boolean` | 固定状态变化时触发 |

### 插槽 (Slots)

| 插槽      | 说明           |
| --------- | -------------- |
| `default` | 需要固定的内容 |
