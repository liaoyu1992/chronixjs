# Cascader

Multi-level cascading selection with nested panels.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

A cascader with nested options for province / city / district selection.

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

## Multiple Selection

Use the `multiple` prop to allow selecting more than one value.

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

## Clearable

Add `clearable` to let users reset the selection with a clear icon.

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

## API Reference

### Props

| Prop          | Type                 | Default          | Description        |
| ------------- | -------------------- | ---------------- | ------------------ |
| `value`       | `string \| string[]` | `undefined`      | Selected value(s)  |
| `options`     | `SelectOption[]`     | `[]`             | Nested option tree |
| `multiple`    | `boolean`            | `false`          | Multi-select mode  |
| `clearable`   | `boolean`            | `false`          | Show clear icon    |
| `placeholder` | `string`             | `''`             | Placeholder text   |
| `disabled`    | `boolean`            | `false`          | Disable cascader   |
| `placement`   | `PopupPlacement`     | `'bottom-start'` | Dropdown position  |

### Events

| Event          | Payload              | Description   |
| -------------- | -------------------- | ------------- |
| `update:value` | `string \| string[]` | Value changed |
