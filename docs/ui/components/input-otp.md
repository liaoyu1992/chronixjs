# Input OTP 验证码输入

一次性密码输入组件，包含 N 个独立单元格共享一个受控值。

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
  <CxInputOtp v-model:value="otp" :length="6" @complete="onComplete" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxInputOtp } from '@chronixjs/ui-vue3';

const otp = ref('');

function onComplete(value: string) {
  console.log('OTP complete:', value);
}
</script>
```

```vue [Vue 2]
<template>
  <CxInputOtp :value.sync="otp" :length="6" @complete="onComplete" />
</template>

<script>
import { CxInputOtp } from '@chronixjs/ui-vue2';
export default {
  components: { CxInputOtp },
  data() {
    return { otp: '' };
  },
  methods: {
    onComplete(value) {
      console.log('OTP complete:', value);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInputOtp } from '@chronixjs/ui-react';

export function App() {
  const [otp, setOtp] = useState('');

  function onComplete(value: string) {
    console.log('OTP complete:', value);
  }

  return <CxInputOtp value={otp} onUpdateValue={setOtp} length={6} onComplete={onComplete} />;
}
```

:::

## API 参考

### 属性 (Props)

| Prop       | 类型                  | 默认值      | 描述           |
| ---------- | --------------------- | ----------- | -------------- |
| `value`    | `string`              | `''`        | 当前 OTP 值    |
| `length`   | `number`              | `6`         | 输入单元格数量 |
| `disabled` | `boolean`             | `false`     | 禁用所有单元格 |
| `error`    | `string \| undefined` | `undefined` | 错误信息       |

### 事件 (Events)

| Event          | Payload  | 描述                       |
| -------------- | -------- | -------------------------- |
| `update:value` | `string` | 值变化时触发               |
| `complete`     | `string` | 值长度等于 `length` 时触发 |
