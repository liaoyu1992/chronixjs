# Pop Select

Option-list popup surface wrapping Popover for simple single-select from a dropdown.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

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

## API Reference

### Props

| Prop         | Type                         | Default          | Description                 |
| ------------ | ---------------------------- | ---------------- | --------------------------- |
| `value`      | `string \| undefined`        | `undefined`      | Selected option value       |
| `options`    | `readonly PopSelectOption[]` | `[]`             | Available options           |
| `show`       | `boolean \| undefined`       | `undefined`      | Controlled popup visibility |
| `trigger`    | `'click' \| 'hover'`         | `'click'`        | Popup trigger mode          |
| `placement`  | `PopupPlacement`             | `'bottom-start'` | Popup placement             |
| `offset`     | `number`                     | `4`              | Distance from trigger in px |
| `flip`       | `boolean`                    | `true`           | Auto-flip when overflowing  |
| `widthMatch` | `boolean`                    | `false`          | Match trigger width         |
| `disabled`   | `boolean`                    | `false`          | Disable the select          |

### PopSelectOption

| Property   | Type      | Description         |
| ---------- | --------- | ------------------- |
| `key`      | `string`  | Unique identifier   |
| `label`    | `string`  | Display text        |
| `value`    | `string`  | Option value        |
| `disabled` | `boolean` | Disable this option |

### Events

| Event          | Payload   | Description                         |
| -------------- | --------- | ----------------------------------- |
| `update:value` | `string`  | Fires when selection changes        |
| `update:show`  | `boolean` | Fires when popup visibility changes |

### Slots

| Slot      | Description     |
| --------- | --------------- |
| `default` | Trigger element |
