# Result 结果

用于操作结果和错误页面的终态展示组件。

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
  <CxResult status="success" title="Success" description="Your operation was completed." />
</template>

<script setup lang="ts">
import { CxResult } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxResult status="success" title="Success" description="Your operation was completed." />
</template>

<script>
import { CxResult } from '@chronixjs/ui-vue2';
export default {
  components: { CxResult },
};
</script>
```

```tsx [React]
import { CxResult } from '@chronixjs/ui-react';

export function App() {
  return <CxResult status="success" title="Success" description="Your operation was completed." />;
}
```

:::

## 状态类型

使用 `status` 属性显示不同的结果状态。语义状态包括 `info`、`success`、`warning` 和 `error`。HTTP 状态码 `404`、`403`、`500` 和 `418` 也支持用于错误页面。

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxResult status="info" title="Information" description="Here is some useful information." />
    <CxResult status="success" title="Success" description="The operation succeeded." />
    <CxResult status="warning" title="Warning" description="Something needs your attention." />
    <CxResult status="error" title="Error" description="The operation failed." />
    <CxResult status="404" title="404" description="The page you visited does not exist." />
    <CxResult status="403" title="403" description="Sorry, you do not have access." />
    <CxResult status="500" title="500" description="Internal server error." />
    <CxResult status="418" title="418" description="I'm a teapot." />
  </div>
</template>

<script setup lang="ts">
import { CxResult } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxResult status="info" title="Information" description="Here is some useful information." />
    <CxResult status="success" title="Success" description="The operation succeeded." />
    <CxResult status="warning" title="Warning" description="Something needs your attention." />
    <CxResult status="error" title="Error" description="The operation failed." />
    <CxResult status="404" title="404" description="The page you visited does not exist." />
    <CxResult status="403" title="403" description="Sorry, you do not have access." />
    <CxResult status="500" title="500" description="Internal server error." />
    <CxResult status="418" title="418" description="I'm a teapot." />
  </div>
</template>

<script>
import { CxResult } from '@chronixjs/ui-vue2';
export default {
  components: { CxResult },
};
</script>
```

```tsx [React]
import { CxResult } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <CxResult status="info" title="Information" description="Here is some useful information." />
      <CxResult status="success" title="Success" description="The operation succeeded." />
      <CxResult status="warning" title="Warning" description="Something needs your attention." />
      <CxResult status="error" title="Error" description="The operation failed." />
      <CxResult status="404" title="404" description="The page you visited does not exist." />
      <CxResult status="403" title="403" description="Sorry, you do not have access." />
      <CxResult status="500" title="500" description="Internal server error." />
      <CxResult status="418" title="418" description="I'm a teapot." />
    </div>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性          | 类型                                                                                           | 默认值      | 说明       |
| ------------- | ---------------------------------------------------------------------------------------------- | ----------- | ---------- |
| `status`      | `'default' \| 'info' \| 'success' \| 'warning' \| 'error' \| '404' \| '403' \| '500' \| '418'` | `'info'`    | 结果状态   |
| `title`       | `string`                                                                                       | `undefined` | 标题文本   |
| `description` | `string`                                                                                       | `undefined` | 副标题文本 |
