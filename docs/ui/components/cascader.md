# Cascader 级联选择

多级级联选择，带有嵌套面板。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

带有嵌套选项的级联选择器，用于省/市/区选择。

::: code-group

```vue [Vue 3]
<template>
  <CxCascader :options="options" v-model:value="value" placeholder="Select region" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCascader } from '@chronixjs/ui-vue3';

const value = ref<string | undefined>(undefined);

const options = ref([
  {
    key: 'zhejiang',
    label: 'Zhejiang',
    value: 'zhejiang',
    children: [
      {
        key: 'hangzhou',
        label: 'Hangzhou',
        value: 'hangzhou',
        children: [
          { key: 'xihu', label: 'West Lake', value: 'xihu' },
          { key: 'xiasha', label: 'Xiasha', value: 'xiasha' },
        ],
      },
      {
        key: 'ningbo',
        label: 'Ningbo',
        value: 'ningbo',
        children: [{ key: 'jiangbei', label: 'Jiangbei', value: 'jiangbei' }],
      },
    ],
  },
  {
    key: 'jiangsu',
    label: 'Jiangsu',
    value: 'jiangsu',
    children: [
      {
        key: 'nanjing',
        label: 'Nanjing',
        value: 'nanjing',
        children: [{ key: 'zhonghuamen', label: 'Zhonghua Gate', value: 'zhonghuamen' }],
      },
    ],
  },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxCascader :options="options" :value.sync="value" placeholder="Select region" />
</template>

<script>
import { CxCascader } from '@chronixjs/ui-vue2';

export default {
  components: { CxCascader },
  data() {
    return {
      value: undefined,
      options: [
        {
          key: 'zhejiang',
          label: 'Zhejiang',
          value: 'zhejiang',
          children: [
            {
              key: 'hangzhou',
              label: 'Hangzhou',
              value: 'hangzhou',
              children: [
                { key: 'xihu', label: 'West Lake', value: 'xihu' },
                { key: 'xiasha', label: 'Xiasha', value: 'xiasha' },
              ],
            },
            {
              key: 'ningbo',
              label: 'Ningbo',
              value: 'ningbo',
              children: [{ key: 'jiangbei', label: 'Jiangbei', value: 'jiangbei' }],
            },
          ],
        },
        {
          key: 'jiangsu',
          label: 'Jiangsu',
          value: 'jiangsu',
          children: [
            {
              key: 'nanjing',
              label: 'Nanjing',
              value: 'nanjing',
              children: [{ key: 'zhonghuamen', label: 'Zhonghua Gate', value: 'zhonghuamen' }],
            },
          ],
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCascader } from '@chronixjs/ui-react';

const OPTIONS = [
  {
    key: 'zhejiang',
    label: 'Zhejiang',
    value: 'zhejiang',
    children: [
      {
        key: 'hangzhou',
        label: 'Hangzhou',
        value: 'hangzhou',
        children: [
          { key: 'xihu', label: 'West Lake', value: 'xihu' },
          { key: 'xiasha', label: 'Xiasha', value: 'xiasha' },
        ],
      },
      {
        key: 'ningbo',
        label: 'Ningbo',
        value: 'ningbo',
        children: [{ key: 'jiangbei', label: 'Jiangbei', value: 'jiangbei' }],
      },
    ],
  },
  {
    key: 'jiangsu',
    label: 'Jiangsu',
    value: 'jiangsu',
    children: [
      {
        key: 'nanjing',
        label: 'Nanjing',
        value: 'nanjing',
        children: [{ key: 'zhonghuamen', label: 'Zhonghua Gate', value: 'zhonghuamen' }],
      },
    ],
  },
];

export function App() {
  const [value, setValue] = useState<string | undefined>(undefined);

  return (
    <CxCascader
      options={OPTIONS}
      value={value}
      onUpdateValue={setValue}
      placeholder="Select region"
    />
  );
}
```

:::

## 多选

使用 `multiple` 属性允许选择多个值。

::: code-group

```vue [Vue 3]
<template>
  <CxCascader :options="options" v-model:value="values" multiple placeholder="Select regions" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCascader } from '@chronixjs/ui-vue3';

const values = ref<string[]>([]);

const options = ref([
  {
    key: 'zhejiang',
    label: 'Zhejiang',
    value: 'zhejiang',
    children: [
      {
        key: 'hangzhou',
        label: 'Hangzhou',
        value: 'hangzhou',
        children: [{ key: 'xihu', label: 'West Lake', value: 'xihu' }],
      },
    ],
  },
  {
    key: 'jiangsu',
    label: 'Jiangsu',
    value: 'jiangsu',
    children: [
      {
        key: 'nanjing',
        label: 'Nanjing',
        value: 'nanjing',
        children: [{ key: 'zhonghuamen', label: 'Zhonghua Gate', value: 'zhonghuamen' }],
      },
    ],
  },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxCascader :options="options" :value.sync="values" multiple placeholder="Select regions" />
</template>

<script>
import { CxCascader } from '@chronixjs/ui-vue2';

export default {
  components: { CxCascader },
  data() {
    return {
      values: [],
      options: [
        {
          key: 'zhejiang',
          label: 'Zhejiang',
          value: 'zhejiang',
          children: [
            {
              key: 'hangzhou',
              label: 'Hangzhou',
              value: 'hangzhou',
              children: [{ key: 'xihu', label: 'West Lake', value: 'xihu' }],
            },
          ],
        },
        {
          key: 'jiangsu',
          label: 'Jiangsu',
          value: 'jiangsu',
          children: [
            {
              key: 'nanjing',
              label: 'Nanjing',
              value: 'nanjing',
              children: [{ key: 'zhonghuamen', label: 'Zhonghua Gate', value: 'zhonghuamen' }],
            },
          ],
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCascader } from '@chronixjs/ui-react';

const OPTIONS = [
  {
    key: 'zhejiang',
    label: 'Zhejiang',
    value: 'zhejiang',
    children: [
      {
        key: 'hangzhou',
        label: 'Hangzhou',
        value: 'hangzhou',
        children: [{ key: 'xihu', label: 'West Lake', value: 'xihu' }],
      },
    ],
  },
  {
    key: 'jiangsu',
    label: 'Jiangsu',
    value: 'jiangsu',
    children: [
      {
        key: 'nanjing',
        label: 'Nanjing',
        value: 'nanjing',
        children: [{ key: 'zhonghuamen', label: 'Zhonghua Gate', value: 'zhonghuamen' }],
      },
    ],
  },
];

export function App() {
  const [values, setValues] = useState<string[]>([]);

  return (
    <CxCascader
      options={OPTIONS}
      value={values}
      onUpdateValue={setValues}
      multiple
      placeholder="Select regions"
    />
  );
}
```

:::

## 可清除

添加 `clearable` 让用户通过清除图标重置选择。

::: code-group

```vue [Vue 3]
<template>
  <CxCascader :options="options" v-model:value="value" clearable placeholder="Select and clear" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxCascader } from '@chronixjs/ui-vue3';

const value = ref<string | undefined>(undefined);

const options = ref([
  {
    key: 'zhejiang',
    label: 'Zhejiang',
    value: 'zhejiang',
    children: [
      {
        key: 'hangzhou',
        label: 'Hangzhou',
        value: 'hangzhou',
        children: [{ key: 'xihu', label: 'West Lake', value: 'xihu' }],
      },
    ],
  },
  {
    key: 'jiangsu',
    label: 'Jiangsu',
    value: 'jiangsu',
    children: [
      {
        key: 'nanjing',
        label: 'Nanjing',
        value: 'nanjing',
        children: [{ key: 'zhonghuamen', label: 'Zhonghua Gate', value: 'zhonghuamen' }],
      },
    ],
  },
]);
</script>
```

```vue [Vue 2]
<template>
  <CxCascader :options="options" :value.sync="value" clearable placeholder="Select and clear" />
</template>

<script>
import { CxCascader } from '@chronixjs/ui-vue2';

export default {
  components: { CxCascader },
  data() {
    return {
      value: undefined,
      options: [
        {
          key: 'zhejiang',
          label: 'Zhejiang',
          value: 'zhejiang',
          children: [
            {
              key: 'hangzhou',
              label: 'Hangzhou',
              value: 'hangzhou',
              children: [{ key: 'xihu', label: 'West Lake', value: 'xihu' }],
            },
          ],
        },
        {
          key: 'jiangsu',
          label: 'Jiangsu',
          value: 'jiangsu',
          children: [
            {
              key: 'nanjing',
              label: 'Nanjing',
              value: 'nanjing',
              children: [{ key: 'zhonghuamen', label: 'Zhonghua Gate', value: 'zhonghuamen' }],
            },
          ],
        },
      ],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxCascader } from '@chronixjs/ui-react';

const OPTIONS = [
  {
    key: 'zhejiang',
    label: 'Zhejiang',
    value: 'zhejiang',
    children: [
      {
        key: 'hangzhou',
        label: 'Hangzhou',
        value: 'hangzhou',
        children: [{ key: 'xihu', label: 'West Lake', value: 'xihu' }],
      },
    ],
  },
  {
    key: 'jiangsu',
    label: 'Jiangsu',
    value: 'jiangsu',
    children: [
      {
        key: 'nanjing',
        label: 'Nanjing',
        value: 'nanjing',
        children: [{ key: 'zhonghuamen', label: 'Zhonghua Gate', value: 'zhonghuamen' }],
      },
    ],
  },
];

export function App() {
  const [value, setValue] = useState<string | undefined>(undefined);

  return (
    <CxCascader
      options={OPTIONS}
      value={value}
      onUpdateValue={setValue}
      clearable
      placeholder="Select and clear"
    />
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性          | 类型                 | 默认值           | 说明           |
| ------------- | -------------------- | ---------------- | -------------- |
| `value`       | `string \| string[]` | `undefined`      | 选中的值       |
| `options`     | `SelectOption[]`     | `[]`             | 嵌套选项树     |
| `multiple`    | `boolean`            | `false`          | 多选模式       |
| `clearable`   | `boolean`            | `false`          | 显示清除图标   |
| `placeholder` | `string`             | `''`             | 占位文本       |
| `disabled`    | `boolean`            | `false`          | 禁用级联选择器 |
| `placement`   | `PopupPlacement`     | `'bottom-start'` | 下拉菜单位置   |

### 事件 (Events)

| 事件           | 载荷                 | 说明         |
| -------------- | -------------------- | ------------ |
| `update:value` | `string \| string[]` | 值变化时触发 |
