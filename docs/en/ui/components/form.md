<script setup>
import FormBasic from '../../../ui/components/demos/form/FormBasic.vue';
import formBasicCode from '../../../ui/components/demos/form/FormBasic.vue?raw';
import formBasicVue2 from '../../../ui/components/demos/form/FormBasic.vue2?raw';
import formBasicReact from '../../../ui/components/demos/form/FormBasic.react?raw';
</script>

# Form

Form layout with validation support, label positioning, and field-level rules.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="A simple form with two fields (name and email)." :code="formBasicCode" :code-vue2="formBasicVue2" :code-react="formBasicReact">
  <FormBasic />
</DemoBox>

## Label Placement

Labels can be placed above the field (default) or to the left.

### Top Labels (default)

::: code-group

```vue [Vue 3]
<template>
  <ChronixForm :model="form" labelPlacement="top">
    <ChronixFormItem label="Email" path="email">
      <CxInput v-model:value="form.email" />
    </ChronixFormItem>
    <ChronixFormItem label="Name" path="name">
      <CxInput v-model:value="form.name" />
    </ChronixFormItem>
  </ChronixForm>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { ChronixForm, ChronixFormItem, CxInput } from '@chronixjs/ui-vue3';

const form = reactive({ email: '', name: '' });
</script>
```

```vue [Vue 2]
<template>
  <ChronixForm :model="form" labelPlacement="top">
    <ChronixFormItem label="Email" path="email">
      <CxInput v-model:value="form.email" />
    </ChronixFormItem>
    <ChronixFormItem label="Name" path="name">
      <CxInput v-model:value="form.name" />
    </ChronixFormItem>
  </ChronixForm>
</template>

<script>
import { ChronixForm, ChronixFormItem, CxInput } from '@chronixjs/ui-vue2';

export default {
  components: { ChronixForm, ChronixFormItem, CxInput },
  data() {
    return {
      form: { email: '', name: '' },
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { ChronixForm, ChronixFormItem, CxInput } from '@chronixjs/ui-react';

export function App() {
  const [form, setForm] = useState({ email: '', name: '' });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <ChronixForm model={form} labelPlacement="top">
      <ChronixFormItem label="Email" path="email">
        <CxInput value={form.email} onUpdateValue={(v: string) => updateField('email', v)} />
      </ChronixFormItem>
      <ChronixFormItem label="Name" path="name">
        <CxInput value={form.name} onUpdateValue={(v: string) => updateField('name', v)} />
      </ChronixFormItem>
    </ChronixForm>
  );
}
```

:::

### Left Labels

::: code-group

```vue [Vue 3]
<template>
  <ChronixForm :model="form" labelPlacement="left" :labelWidth="80">
    <ChronixFormItem label="Email" path="email">
      <CxInput v-model:value="form.email" />
    </ChronixFormItem>
    <ChronixFormItem label="Name" path="name">
      <CxInput v-model:value="form.name" />
    </ChronixFormItem>
  </ChronixForm>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { ChronixForm, ChronixFormItem, CxInput } from '@chronixjs/ui-vue3';

const form = reactive({ email: '', name: '' });
</script>
```

```vue [Vue 2]
<template>
  <ChronixForm :model="form" labelPlacement="left" :labelWidth="80">
    <ChronixFormItem label="Email" path="email">
      <CxInput v-model:value="form.email" />
    </ChronixFormItem>
    <ChronixFormItem label="Name" path="name">
      <CxInput v-model:value="form.name" />
    </ChronixFormItem>
  </ChronixForm>
</template>

<script>
import { ChronixForm, ChronixFormItem, CxInput } from '@chronixjs/ui-vue2';

export default {
  components: { ChronixForm, ChronixFormItem, CxInput },
  data() {
    return {
      form: { email: '', name: '' },
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { ChronixForm, ChronixFormItem, CxInput } from '@chronixjs/ui-react';

export function App() {
  const [form, setForm] = useState({ email: '', name: '' });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <ChronixForm model={form} labelPlacement="left" labelWidth={80}>
      <ChronixFormItem label="Email" path="email">
        <CxInput value={form.email} onUpdateValue={(v: string) => updateField('email', v)} />
      </ChronixFormItem>
      <ChronixFormItem label="Name" path="name">
        <CxInput value={form.name} onUpdateValue={(v: string) => updateField('name', v)} />
      </ChronixFormItem>
    </ChronixForm>
  );
}
```

:::

## Inline Form

Use the `inline` prop to display form items in a horizontal row.

::: code-group

```vue [Vue 3]
<template>
  <ChronixForm :model="form" inline>
    <ChronixFormItem label="Name" path="name">
      <CxInput v-model:value="form.name" placeholder="Name" />
    </ChronixFormItem>
    <ChronixFormItem label="Email" path="email">
      <CxInput v-model:value="form.email" placeholder="Email" />
    </ChronixFormItem>
    <ChronixFormItem>
      <CxButton type="primary">Search</CxButton>
    </ChronixFormItem>
  </ChronixForm>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { ChronixForm, ChronixFormItem, CxInput, CxButton } from '@chronixjs/ui-vue3';

const form = reactive({ name: '', email: '' });
</script>
```

```vue [Vue 2]
<template>
  <ChronixForm :model="form" inline>
    <ChronixFormItem label="Name" path="name">
      <CxInput v-model:value="form.name" placeholder="Name" />
    </ChronixFormItem>
    <ChronixFormItem label="Email" path="email">
      <CxInput v-model:value="form.email" placeholder="Email" />
    </ChronixFormItem>
    <ChronixFormItem>
      <CxButton type="primary">Search</CxButton>
    </ChronixFormItem>
  </ChronixForm>
</template>

<script>
import { ChronixForm, ChronixFormItem, CxInput, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { ChronixForm, ChronixFormItem, CxInput, CxButton },
  data() {
    return {
      form: { name: '', email: '' },
    };
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { ChronixForm, ChronixFormItem, CxInput, CxButton } from '@chronixjs/ui-react';

export function App() {
  const [form, setForm] = useState({ name: '', email: '' });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <ChronixForm model={form} inline>
      <ChronixFormItem label="Name" path="name">
        <CxInput
          value={form.name}
          onUpdateValue={(v: string) => updateField('name', v)}
          placeholder="Name"
        />
      </ChronixFormItem>
      <ChronixFormItem label="Email" path="email">
        <CxInput
          value={form.email}
          onUpdateValue={(v: string) => updateField('email', v)}
          placeholder="Email"
        />
      </ChronixFormItem>
      <ChronixFormItem>
        <CxButton type="primary">Search</CxButton>
      </ChronixFormItem>
    </ChronixForm>
  );
}
```

:::

## API Reference

### ChronixForm Props

| Prop              | Type                                                 | Default     | Description            |
| ----------------- | ---------------------------------------------------- | ----------- | ---------------------- |
| `model`           | `Record<string, unknown>`                            | `{}`        | Form data model        |
| `rules`           | `Record<string, ValidationRule \| ValidationRule[]>` | `undefined` | Validation rules       |
| `labelPlacement`  | `'left' \| 'top'`                                    | `'top'`     | Label position         |
| `labelWidth`      | `number \| string`                                   | `undefined` | Label width            |
| `labelAlign`      | `'left' \| 'right'`                                  | `'left'`    | Label alignment        |
| `inline`          | `boolean`                                            | `false`     | Inline layout          |
| `size`            | `'small' \| 'medium' \| 'large'`                     | `undefined` | Component size         |
| `disabled`        | `boolean`                                            | `false`     | Disable all fields     |
| `showFeedback`    | `boolean`                                            | `true`      | Show error messages    |
| `showRequireMark` | `boolean`                                            | `true`      | Show required asterisk |

### ChronixFormItem Props

| Prop           | Type                                 | Default     | Description          |
| -------------- | ------------------------------------ | ----------- | -------------------- |
| `label`        | `string`                             | `undefined` | Field label          |
| `path`         | `string`                             | `undefined` | Field path in model  |
| `rule`         | `ValidationRule \| ValidationRule[]` | `undefined` | Field-level rules    |
| `required`     | `boolean`                            | `false`     | Mark as required     |
| `showFeedback` | `boolean`                            | `true`      | Show error for field |

### Exposed Methods

| Method                | Description                          |
| --------------------- | ------------------------------------ |
| `validate()`          | Validate all fields, returns Promise |
| `restoreValidation()` | Clear all validation errors          |

### Slots

| Slot      | Description                   |
| --------- | ----------------------------- |
| `default` | Field control area (FormItem) |
