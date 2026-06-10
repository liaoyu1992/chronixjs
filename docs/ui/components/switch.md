# Switch 开关

用于开/关二元状态的切换开关组件。渲染为带有 ARIA 无障碍属性的原生 `<button role="switch">`。

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
  <CxSwitch v-model:checked="enabled" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSwitch } from '@chronixjs/ui-vue3';

const enabled = ref(false);
</script>
```

```vue [Vue 2]
<template>
  <CxSwitch v-model:checked="enabled" />
</template>

<script>
import { CxSwitch } from '@chronixjs/ui-vue2';
export default {
  components: { CxSwitch },
  data() {
    return { enabled: false };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSwitch } from '@chronixjs/ui-react';

export function App() {
  const [enabled, setEnabled] = useState(false);
  return <CxSwitch checked={enabled} onUpdateChecked={setEnabled} />;
}
```

:::

## 尺寸

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 16px; align-items: center;">
    <CxSwitch size="small" />
    <CxSwitch size="medium" />
    <CxSwitch size="large" />
  </div>
</template>

<script setup lang="ts">
import { CxSwitch } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 16px; align-items: center;">
    <CxSwitch size="small" />
    <CxSwitch size="medium" />
    <CxSwitch size="large" />
  </div>
</template>

<script>
import { CxSwitch } from '@chronixjs/ui-vue2';
export default { components: { CxSwitch } };
</script>
```

```tsx [React]
import { CxSwitch } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <CxSwitch size="small" />
      <CxSwitch size="medium" />
      <CxSwitch size="large" />
    </div>
  );
}
```

:::

## 禁用状态

::: code-group

```vue [Vue 3]
<template>
  <CxSwitch checked disabled />
</template>

<script setup lang="ts">
import { CxSwitch } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<CxSwitch checked disabled />
```

:::

## 错误状态

::: code-group

```vue [Vue 3]
<template>
  <CxSwitch v-model:checked="agreed" error="You must enable this to continue" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSwitch } from '@chronixjs/ui-vue3';

const agreed = ref(false);
</script>
```

```tsx [React]
<CxSwitch checked={agreed} onUpdateChecked={setAgreed} error="You must enable this" />
```

:::

## 带标签

与文本组合实现描述性切换：

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; align-items: center; gap: 8px;">
    <CxSwitch v-model:checked="darkMode" />
    <span>Dark Mode</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSwitch } from '@chronixjs/ui-vue3';

const darkMode = ref(false);
</script>
```

```tsx [React]
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
  <CxSwitch checked={darkMode} onUpdateChecked={setDarkMode} />
  <span>Dark Mode</span>
</div>
```

:::

## 无障碍

开关渲染为 `<button type="button" role="switch">`，具有以下特性：

- `aria-checked` 反映选中状态
- 禁用时带有 `aria-disabled`
- 使用 Space/Enter 键切换

## API 参考

### 属性 (Props)

| 属性       | 类型                             | 默认值      | 说明                 |
| ---------- | -------------------------------- | ----------- | -------------------- |
| `checked`  | `boolean`                        | `false`     | 开/关状态（v-model） |
| `disabled` | `boolean`                        | `false`     | 禁用开关             |
| `size`     | `'small' \| 'medium' \| 'large'` | `'medium'`  | 开关尺寸             |
| `error`    | `string`                         | `undefined` | 错误提示信息         |

### 事件 (Events)

| 事件             | 载荷      | 说明                |
| ---------------- | --------- | ------------------- |
| `update:checked` | `boolean` | 状态变化（v-model） |
