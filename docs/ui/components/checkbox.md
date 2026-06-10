# Checkbox 复选框

复选框组件，支持半选状态、标签和校验错误。

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
  <CxCheckbox v-model:checked="checked" label="Accept terms" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCheckbox } from '@chronixjs/ui-vue3';

const checked = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <CxCheckbox v-model:checked="checked" label="Accept terms" />
</template>

<script>
import { CxCheckbox } from '@chronixjs/ui-vue2';
export default {
  components: { CxCheckbox },
  data() {
    return { checked: false };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCheckbox } from '@chronixjs/ui-react';

export function App() {
  const [checked, setChecked] = useState(false);
  return <CxCheckbox checked={checked} onUpdateChecked={setChecked} label="Accept terms" />;
}
```

:::

## 自定义标签插槽

使用默认插槽实现富文本标签内容：

::: code-group

```vue [Vue 3]
<template>
  <CxCheckbox v-model:checked="checked">
    <strong>Accept</strong> the <a href="/terms">terms and conditions</a>
  </CxCheckbox>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCheckbox } from '@chronixjs/ui-vue3';

const checked = ref(false);
</script>
```

```tsx [React]
<CxCheckbox checked={checked} onUpdateChecked={setChecked}>
  <strong>Accept</strong> the <a href="/terms">terms</a>
</CxCheckbox>
```

:::

## 半选状态

半选状态显示一条横线，适用于"全选"场景：

::: code-group

```vue [Vue 3]
<template>
  <CxCheckbox :checked="allChecked" indeterminate label="Select all" />
</template>

<script setup lang="ts">
import { CxCheckbox } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<CxCheckbox checked={allChecked} indeterminate label="Select all" />
```

:::

## 禁用状态

::: code-group

```vue [Vue 3]
<template>
  <CxCheckbox checked disabled label="Locked option" />
</template>

<script setup lang="ts">
import { CxCheckbox } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<CxCheckbox checked disabled label="Locked option" />
```

:::

## 错误状态

::: code-group

```vue [Vue 3]
<template>
  <CxCheckbox v-model:checked="agreed" error="You must agree to continue" label="Terms" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCheckbox } from '@chronixjs/ui-vue3';

const agreed = ref(false);
</script>
```

```tsx [React]
<CxCheckbox checked={agreed} onUpdateChecked={setAgreed} error="You must agree" label="Terms" />
```

:::

## API 参考

### 属性 (Props)

| 属性            | 类型      | 默认值      | 说明               |
| --------------- | --------- | ----------- | ------------------ |
| `checked`       | `boolean` | `false`     | 选中状态 (v-model) |
| `indeterminate` | `boolean` | `false`     | 半选（—）状态      |
| `disabled`      | `boolean` | `false`     | 禁用复选框         |
| `label`         | `string`  | `undefined` | 标签文本           |
| `error`         | `string`  | `undefined` | 错误提示信息       |

### 事件 (Events)

| 事件             | 载荷      | 说明                 |
| ---------------- | --------- | -------------------- |
| `update:checked` | `boolean` | 状态变化时 (v-model) |

### 插槽 (Slots)

| 插槽      | 说明                                |
| --------- | ----------------------------------- |
| `default` | 自定义标签内容（替代 `label` 属性） |
