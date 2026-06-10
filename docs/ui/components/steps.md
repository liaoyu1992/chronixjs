# Steps 步骤条

向导式步骤指示器，用于展示多阶段流程的进度。

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
  <div>
    <CxSteps :items="items" :current="current" />
    <div style="margin-top: 16px;">
      <CxButton @click="current = Math.max(current - 1, 0)">Previous</CxButton>
      <CxButton @click="current = Math.min(current + 1, 2)" style="margin-left: 8px;"
        >Next</CxButton
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSteps } from '@chronixjs/ui-vue3';
import { CxButton } from '@chronixjs/ui-vue3';

const current = ref(0);
const items = [
  { key: '1', title: 'Account', description: 'Create your account' },
  { key: '2', title: 'Profile', description: 'Fill in your profile' },
  { key: '3', title: 'Complete', description: 'All done' },
];
</script>
```

```vue [Vue 2]
<template>
  <div>
    <CxSteps :items="items" :current="current" />
    <div style="margin-top: 16px;">
      <CxButton @click="current = Math.max(current - 1, 0)">Previous</CxButton>
      <CxButton @click="current = Math.min(current + 1, 2)" style="margin-left: 8px;"
        >Next</CxButton
      >
    </div>
  </div>
</template>

<script>
import { CxSteps } from '@chronixjs/ui-vue2';
import { CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxSteps, CxButton },
  data() {
    return {
      current: 0,
      items: [
        { key: '1', title: 'Account', description: 'Create your account' },
        { key: '2', title: 'Profile', description: 'Fill in your profile' },
        { key: '3', title: 'Complete', description: 'All done' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSteps } from '@chronixjs/ui-react';
import { CxButton } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Account', description: 'Create your account' },
  { key: '2', title: 'Profile', description: 'Fill in your profile' },
  { key: '3', title: 'Complete', description: 'All done' },
];

export function App() {
  const [current, setCurrent] = useState(0);

  return (
    <div>
      <CxSteps items={items} current={current} />
      <div style={{ marginTop: 16 }}>
        <CxButton onClick={() => setCurrent(Math.max(current - 1, 0))}>Previous</CxButton>
        <CxButton onClick={() => setCurrent(Math.min(current + 1, 2))} style={{ marginLeft: 8 }}>
          Next
        </CxButton>
      </div>
    </div>
  );
}
```

:::

## 垂直方向

使用 `direction="vertical"` 以垂直布局渲染步骤条。

::: code-group

```vue [Vue 3]
<template>
  <CxSteps :items="items" :current="current" direction="vertical" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxSteps } from '@chronixjs/ui-vue3';

const current = ref(1);
const items = [
  { key: '1', title: 'Account', description: 'Create your account' },
  { key: '2', title: 'Profile', description: 'Fill in your profile' },
  { key: '3', title: 'Complete', description: 'All done' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSteps :items="items" :current="current" direction="vertical" />
</template>

<script>
import { CxSteps } from '@chronixjs/ui-vue2';

export default {
  components: { CxSteps },
  data() {
    return {
      current: 1,
      items: [
        { key: '1', title: 'Account', description: 'Create your account' },
        { key: '2', title: 'Profile', description: 'Fill in your profile' },
        { key: '3', title: 'Complete', description: 'All done' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxSteps } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Account', description: 'Create your account' },
  { key: '2', title: 'Profile', description: 'Fill in your profile' },
  { key: '3', title: 'Complete', description: 'All done' },
];

export function App() {
  const [current, setCurrent] = useState(1);

  return <CxSteps items={items} current={current} direction="vertical" />;
}
```

:::

## 错误步骤

通过在步骤项上设置 `status: 'error'` 来覆盖单个步骤的状态。可用于突出显示失败的步骤。

::: code-group

```vue [Vue 3]
<template>
  <CxSteps :items="items" :current="1" />
</template>

<script setup lang="ts">
import { CxSteps } from '@chronixjs/ui-vue3';

const items = [
  { key: '1', title: 'Account', description: 'Create your account', status: 'finish' },
  { key: '2', title: 'Profile', description: 'Fill in your profile', status: 'error' },
  { key: '3', title: 'Complete', description: 'All done', status: 'wait' },
];
</script>
```

```vue [Vue 2]
<template>
  <CxSteps :items="items" :current="1" />
</template>

<script>
import { CxSteps } from '@chronixjs/ui-vue2';

export default {
  components: { CxSteps },
  data() {
    return {
      items: [
        { key: '1', title: 'Account', description: 'Create your account', status: 'finish' },
        { key: '2', title: 'Profile', description: 'Fill in your profile', status: 'error' },
        { key: '3', title: 'Complete', description: 'All done', status: 'wait' },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { CxSteps } from '@chronixjs/ui-react';

const items = [
  { key: '1', title: 'Account', description: 'Create your account', status: 'finish' },
  { key: '2', title: 'Profile', description: 'Fill in your profile', status: 'error' },
  { key: '3', title: 'Complete', description: 'All done', status: 'wait' },
];

export function App() {
  return <CxSteps items={items} current={1} />;
}
```

:::

## API 参考

### 属性 (Props)

| 属性        | 类型                         | 默认值         | 说明                      |
| ----------- | ---------------------------- | -------------- | ------------------------- |
| `items`     | `StepItem[]`                 | `[]`           | 步骤定义                  |
| `current`   | `number`                     | `0`            | 当前步骤索引（从 0 开始） |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 布局方向                  |

### StepItem 接口

| 字段          | 类型                                         | 说明     |
| ------------- | -------------------------------------------- | -------- |
| `key`         | `string`                                     | 唯一键   |
| `title`       | `string`                                     | 步骤标题 |
| `description` | `string`                                     | 步骤描述 |
| `status`      | `'wait' \| 'process' \| 'finish' \| 'error'` | 覆盖状态 |
