<script setup>
import DropdownBasic from './demos/dropdown/DropdownBasic.vue';
import dropdownBasicCode from './demos/dropdown/DropdownBasic.vue?raw';
import dropdownBasicVue2 from './demos/dropdown/DropdownBasic.vue2?raw';
import dropdownBasicReact from './demos/dropdown/DropdownBasic.react?raw';
</script>

# Dropdown 下拉菜单

通过悬停、点击或聚焦触发的弹出菜单，支持键盘导航。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="点击触发的基础下拉菜单，包含 3 个选项。" :code="dropdownBasicCode" :code-vue2="dropdownBasicVue2" :code-react="dropdownBasicReact">
  <DropdownBasic />
</DemoBox>

## 触发方式

使用 `trigger` 属性控制下拉菜单的打开方式。默认值为 `click`。

### 点击触发（默认）

::: code-group

```vue [Vue 3]
<template>
  <CxDropdown :options="options" trigger="click" @select="onSelect">
    <CxButton>Click to Open</CxButton>
  </CxDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDropdown, CxButton } from '@chronixjs/ui-vue3';

const options = ref([
  { key: '1', label: 'Edit', value: 'edit' },
  { key: '2', label: 'Delete', value: 'delete' },
]);

function onSelect(option: { key: string; label: string; value: string }) {
  console.log('Selected:', option);
}
</script>
```

```vue [Vue 2]
<template>
  <CxDropdown :options="options" trigger="click" @select="onSelect">
    <CxButton>Click to Open</CxButton>
  </CxDropdown>
</template>

<script>
import { CxDropdown, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDropdown, CxButton },
  data() {
    return {
      options: [
        { key: '1', label: 'Edit', value: 'edit' },
        { key: '2', label: 'Delete', value: 'delete' },
      ],
    };
  },
  methods: {
    onSelect(option) {
      console.log('Selected:', option);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDropdown, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [options] = useState([
    { key: '1', label: 'Edit', value: 'edit' },
    { key: '2', label: 'Delete', value: 'delete' },
  ]);

  function onSelect(option: { key: string; label: string; value: string }) {
    console.log('Selected:', option);
  }

  return (
    <CxDropdown options={options} trigger="click" onSelect={onSelect}>
      <CxButton>Click to Open</CxButton>
    </CxDropdown>
  );
}
```

:::

### 悬停触发

::: code-group

```vue [Vue 3]
<template>
  <CxDropdown :options="options" trigger="hover" @select="onSelect">
    <CxButton>Hover to Open</CxButton>
  </CxDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDropdown, CxButton } from '@chronixjs/ui-vue3';

const options = ref([
  { key: '1', label: 'Profile', value: 'profile' },
  { key: '2', label: 'Settings', value: 'settings' },
  { key: '3', label: 'Logout', value: 'logout' },
]);

function onSelect(option: { key: string; label: string; value: string }) {
  console.log('Selected:', option);
}
</script>
```

```vue [Vue 2]
<template>
  <CxDropdown :options="options" trigger="hover" @select="onSelect">
    <CxButton>Hover to Open</CxButton>
  </CxDropdown>
</template>

<script>
import { CxDropdown, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDropdown, CxButton },
  data() {
    return {
      options: [
        { key: '1', label: 'Profile', value: 'profile' },
        { key: '2', label: 'Settings', value: 'settings' },
        { key: '3', label: 'Logout', value: 'logout' },
      ],
    };
  },
  methods: {
    onSelect(option) {
      console.log('Selected:', option);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDropdown, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [options] = useState([
    { key: '1', label: 'Profile', value: 'profile' },
    { key: '2', label: 'Settings', value: 'settings' },
    { key: '3', label: 'Logout', value: 'logout' },
  ]);

  function onSelect(option: { key: string; label: string; value: string }) {
    console.log('Selected:', option);
  }

  return (
    <CxDropdown options={options} trigger="hover" onSelect={onSelect}>
      <CxButton>Hover to Open</CxButton>
    </CxDropdown>
  );
}
```

:::

## 弹出位置

下拉弹窗支持 12 个弹出位置。默认值为 `bottom-start`。

可用位置：`top`、`top-start`、`top-end`、`bottom`、`bottom-start`、`bottom-end`、`left`、`left-start`、`left-end`、`right`、`right-start`、`right-end`。

::: code-group

```vue [Vue 3]
<template>
  <CxDropdown :options="options" placement="top" @select="onSelect">
    <CxButton>Top Placement</CxButton>
  </CxDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDropdown, CxButton } from '@chronixjs/ui-vue3';

const options = ref([
  { key: '1', label: 'Option 1', value: 'opt1' },
  { key: '2', label: 'Option 2', value: 'opt2' },
]);

function onSelect(option: { key: string; label: string; value: string }) {
  console.log('Selected:', option);
}
</script>
```

```vue [Vue 2]
<template>
  <CxDropdown :options="options" placement="top" @select="onSelect">
    <CxButton>Top Placement</CxButton>
  </CxDropdown>
</template>

<script>
import { CxDropdown, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDropdown, CxButton },
  data() {
    return {
      options: [
        { key: '1', label: 'Option 1', value: 'opt1' },
        { key: '2', label: 'Option 2', value: 'opt2' },
      ],
    };
  },
  methods: {
    onSelect(option) {
      console.log('Selected:', option);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDropdown, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [options] = useState([
    { key: '1', label: 'Option 1', value: 'opt1' },
    { key: '2', label: 'Option 2', value: 'opt2' },
  ]);

  function onSelect(option: { key: string; label: string; value: string }) {
    console.log('Selected:', option);
  }

  return (
    <CxDropdown options={options} placement="top" onSelect={onSelect}>
      <CxButton>Top Placement</CxButton>
    </CxDropdown>
  );
}
```

:::

## 禁用状态

::: code-group

```vue [Vue 3]
<template>
  <CxDropdown :options="options" disabled>
    <CxButton disabled>Disabled</CxButton>
  </CxDropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CxDropdown, CxButton } from '@chronixjs/ui-vue3';

const options = ref([{ key: '1', label: 'Option 1', value: 'opt1' }]);
</script>
```

```vue [Vue 2]
<template>
  <CxDropdown :options="options" disabled>
    <CxButton disabled>Disabled</CxButton>
  </CxDropdown>
</template>

<script>
import { CxDropdown, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxDropdown, CxButton },
  data() {
    return {
      options: [{ key: '1', label: 'Option 1', value: 'opt1' }],
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxDropdown, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [options] = useState([{ key: '1', label: 'Option 1', value: 'opt1' }]);

  return (
    <CxDropdown options={options} disabled>
      <CxButton disabled>Disabled</CxButton>
    </CxDropdown>
  );
}
```

:::

## API 参考

### 属性 (Props)

| Prop        | 类型                                        | 默认值           | 描述             |
| ----------- | ------------------------------------------- | ---------------- | ---------------- |
| `show`      | `boolean`                                   | `undefined`      | 受控显示状态     |
| `trigger`   | `'hover' \| 'click' \| 'focus' \| 'manual'` | `'click'`        | 触发方式         |
| `placement` | `PopupPlacement`                            | `'bottom-start'` | 弹出位置         |
| `options`   | `DropdownOption[]`                          | `[]`             | 选项列表         |
| `disabled`  | `boolean`                                   | `false`          | 是否禁用下拉菜单 |

### 事件 (Events)

| Event         | Payload          | 描述               |
| ------------- | ---------------- | ------------------ |
| `update:show` | `boolean`        | 显示状态变化时触发 |
| `select`      | `DropdownOption` | 选中选项时触发     |

### 插槽 (Slots)

| Slot      | 描述       |
| --------- | ---------- |
| `default` | 触发器元素 |
