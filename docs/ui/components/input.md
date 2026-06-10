# Input 输入框

文本输入组件，支持清除、文本域模式、验证和 IME 组合输入处理。

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
  <CxInput v-model:value="text" placeholder="Enter text..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInput } from '@chronixjs/ui-vue3';

const text = ref('');
</script>
```

```vue [Vue 2]
<template>
  <CxInput v-model:value="text" placeholder="Enter text..." />
</template>

<script>
import { CxInput } from '@chronixjs/ui-vue2';
export default {
  components: { CxInput },
  data() {
    return { text: '' };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInput } from '@chronixjs/ui-react';

export function App() {
  const [text, setText] = useState('');
  return <CxInput value={text} onUpdateValue={setText} placeholder="Enter text..." />;
}
```

:::

## 输入类型

### 文本输入（默认）

::: code-group

```vue [Vue 3]
<template>
  <CxInput v-model:value="name" placeholder="Your name" />
</template>
```

```tsx [React]
<CxInput value={name} onUpdateValue={setName} placeholder="Your name" />
```

:::

### 文本域

设置 `type="textarea"` 用于多行输入：

::: code-group

```vue [Vue 3]
<template>
  <CxInput v-model:value="bio" type="textarea" :rows="4" placeholder="Bio..." />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInput } from '@chronixjs/ui-vue3';

const bio = ref('');
</script>
```

```tsx [React]
<CxInput value={bio} onUpdateValue={setBio} type="textarea" rows={4} placeholder="Bio..." />
```

:::

## 尺寸

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <CxInput size="small" placeholder="Small" />
    <CxInput size="medium" placeholder="Medium" />
    <CxInput size="large" placeholder="Large" />
  </div>
</template>

<script setup lang="ts">
import { CxInput } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
  <CxInput size="small" placeholder="Small" />
  <CxInput size="medium" placeholder="Medium" />
  <CxInput size="large" placeholder="Large" />
</div>
```

:::

## 可清除

当输入框有值时显示清除按钮：

::: code-group

```vue [Vue 3]
<template>
  <CxInput v-model:value="text" clearable placeholder="Type to see clear button" @clear="onClear" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInput } from '@chronixjs/ui-vue3';

const text = ref('Hello');
function onClear() {
  console.log('Cleared');
}
</script>
```

```tsx [React]
<CxInput value={text} onUpdateValue={setText} clearable onClear={() => console.log('Cleared')} />
```

:::

## 错误状态

显示验证错误信息：

::: code-group

```vue [Vue 3]
<template>
  <CxInput v-model:value="email" error="Please enter a valid email" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInput } from '@chronixjs/ui-vue3';

const email = ref('invalid');
</script>
```

```tsx [React]
<CxInput value={email} onUpdateValue={setEmail} error="Please enter a valid email" />
```

:::

## 禁用状态

::: code-group

```vue [Vue 3]
<template>
  <CxInput value="Read only" disabled />
</template>

<script setup lang="ts">
import { CxInput } from '@chronixjs/ui-vue3';
</script>
```

```tsx [React]
<CxInput value="Read only" disabled />
```

:::

## 事件

::: code-group

```vue [Vue 3]
<template>
  <CxInput v-model:value="text" @focus="onFocus" @blur="onBlur" @clear="onClear" />
</template>

<script setup lang="ts">
import { CxInput } from '@chronixjs/ui-vue3';

function onFocus(e: FocusEvent) {
  console.log('Focused');
}
function onBlur(e: FocusEvent) {
  console.log('Blurred');
}
function onClear() {
  console.log('Cleared');
}
</script>
```

:::

## API 参考

### 属性 (Props)

| Prop          | 类型                             | 默认值      | 描述              |
| ------------- | -------------------------------- | ----------- | ----------------- |
| `value`       | `string`                         | `''`        | 输入值（v-model） |
| `type`        | `'text' \| 'textarea'`           | `'text'`    | 输入类型          |
| `placeholder` | `string`                         | `undefined` | 占位文本          |
| `disabled`    | `boolean`                        | `false`     | 是否禁用输入框    |
| `clearable`   | `boolean`                        | `false`     | 是否显示清除按钮  |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | 输入框尺寸        |
| `rows`        | `number`                         | `3`         | 文本域行数        |
| `error`       | `string`                         | `undefined` | 错误信息          |

### 事件 (Events)

| Event          | Payload      | 描述                    |
| -------------- | ------------ | ----------------------- |
| `update:value` | `string`     | 值变化时触发（v-model） |
| `focus`        | `FocusEvent` | 输入框获得焦点时触发    |
| `blur`         | `FocusEvent` | 输入框失去焦点时触发    |
| `clear`        | —            | 清除按钮被点击时触发    |
