# Pop Select 弹出选择

基于 Popover 封装的选项列表弹出面板，用于简单的下拉单选。

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
  <CxPopSelect v-model:value="selected" v-model:show="open" :options="options">
    <button @click="open = true">{{ selectedLabel || 'Select...' }}</button>
  </CxPopSelect>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { CxPopSelect } from '@chronixjs/ui-vue3';

const selected = ref<string | undefined>(undefined);
const open = ref(false);
const options = ref([
  { key: 'a', label: 'Apple', value: 'apple', disabled: false },
  { key: 'b', label: 'Banana', value: 'banana', disabled: false },
  { key: 'c', label: 'Cherry', value: 'cherry', disabled: false },
]);

const selectedLabel = computed(() => options.value.find((o) => o.value === selected.value)?.label);
</script>
```

```vue [Vue 2]
<template>
  <CxPopSelect :value.sync="selected" :show.sync="open" :options="options">
    <button @click="open = true">{{ selectedLabel || 'Select...' }}</button>
  </CxPopSelect>
</template>

<script>
import { CxPopSelect } from '@chronixjs/ui-vue2';
export default {
  components: { CxPopSelect },
  data() {
    return {
      selected: undefined,
      open: false,
      options: [
        { key: 'a', label: 'Apple', value: 'apple', disabled: false },
        { key: 'b', label: 'Banana', value: 'banana', disabled: false },
        { key: 'c', label: 'Cherry', value: 'cherry', disabled: false },
      ],
    };
  },
  computed: {
    selectedLabel() {
      const opt = this.options.find((o) => o.value === this.selected);
      return opt ? opt.label : '';
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxPopSelect } from '@chronixjs/ui-react';

export function App() {
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [options] = useState([
    { key: 'a', label: 'Apple', value: 'apple', disabled: false },
    { key: 'b', label: 'Banana', value: 'banana', disabled: false },
    { key: 'c', label: 'Cherry', value: 'cherry', disabled: false },
  ]);

  const selectedLabel = options.find((o) => o.value === selected)?.label;

  return (
    <CxPopSelect
      value={selected}
      onUpdateValue={setSelected}
      show={open}
      onUpdateShow={setOpen}
      options={options}
    >
      <button onClick={() => setOpen(true)}>{selectedLabel || 'Select...'}</button>
    </CxPopSelect>
  );
}
```

:::

## API 参考

### 属性 (Props)

| 属性         | 类型                         | 默认值           | 说明                   |
| ------------ | ---------------------------- | ---------------- | ---------------------- |
| `value`      | `string \| undefined`        | `undefined`      | 选中的选项值           |
| `options`    | `readonly PopSelectOption[]` | `[]`             | 可用选项               |
| `show`       | `boolean \| undefined`       | `undefined`      | 受控的弹窗显示状态     |
| `trigger`    | `'click' \| 'hover'`         | `'click'`        | 弹窗触发模式           |
| `placement`  | `PopupPlacement`             | `'bottom-start'` | 弹出位置               |
| `offset`     | `number`                     | `4`              | 与触发元素的距离（px） |
| `flip`       | `boolean`                    | `true`           | 溢出时自动翻转         |
| `widthMatch` | `boolean`                    | `false`          | 匹配触发元素宽度       |
| `disabled`   | `boolean`                    | `false`          | 禁用选择器             |

### PopSelectOption

| 属性       | 类型      | 说明       |
| ---------- | --------- | ---------- |
| `key`      | `string`  | 唯一标识   |
| `label`    | `string`  | 显示文本   |
| `value`    | `string`  | 选项值     |
| `disabled` | `boolean` | 禁用此选项 |

### 事件 (Events)

| 事件           | 载荷      | 说明                   |
| -------------- | --------- | ---------------------- |
| `update:value` | `string`  | 选中值变化时触发       |
| `update:show`  | `boolean` | 弹窗显示状态变化时触发 |

### 插槽 (Slots)

| 插槽      | 说明     |
| --------- | -------- |
| `default` | 触发元素 |
