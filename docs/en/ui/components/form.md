# Form

Form layout with validation support, label positioning, and field-level rules.

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
  <ChronixForm :model="form" :rules="rules" ref="formRef">
    <ChronixFormItem label="Username" path="username">
      <CxInput v-model:value="form.username" />
    </ChronixFormItem>
    <ChronixFormItem label="Password" path="password">
      <CxInput v-model:value="form.password" type="password" />
    </ChronixFormItem>
    <ChronixFormItem>
      <CxButton type="primary" @click="handleSubmit">Submit</CxButton>
    </ChronixFormItem>
  </ChronixForm>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ChronixForm, ChronixFormItem, CxInput, CxButton } from '@chronixjs/ui-vue3';

const formRef = ref();
const form = reactive({ username: '', password: '' });
const rules = {
  username: { required: true, message: 'Username is required', trigger: 'blur' },
  password: { required: true, message: 'Password is required', trigger: 'blur' },
};

async function handleSubmit() {
  try {
    await formRef.value?.validate();
    console.log('Form valid!');
  } catch (e) {
    console.log('Validation failed');
  }
}
</script>
```

```vue [Vue 2]
<template>
  <ChronixForm :model="form" :rules="rules" ref="formRef">
    <ChronixFormItem label="Username" path="username">
      <CxInput v-model:value="form.username" />
    </ChronixFormItem>
    <ChronixFormItem label="Password" path="password">
      <CxInput v-model:value="form.password" type="password" />
    </ChronixFormItem>
    <ChronixFormItem>
      <CxButton type="primary" @click="handleSubmit">Submit</CxButton>
    </ChronixFormItem>
  </ChronixForm>
</template>

<script>
import { ChronixForm, ChronixFormItem, CxInput, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { ChronixForm, ChronixFormItem, CxInput, CxButton },
  data() {
    return {
      form: { username: '', password: '' },
      rules: {
        username: { required: true, message: 'Username is required', trigger: 'blur' },
        password: { required: true, message: 'Password is required', trigger: 'blur' },
      },
    };
  },
  methods: {
    async handleSubmit() {
      try {
        await this.$refs.formRef.validate();
        console.log('Form valid!');
      } catch (e) {
        console.log('Validation failed');
      }
    },
  },
};
</script>
```

```tsx [React]
import { useState, useRef } from 'react';
import { ChronixForm, ChronixFormItem, CxInput, CxButton } from '@chronixjs/ui-react';

export function App() {
  const formRef = useRef<{ validate: () => Promise<void>; restoreValidation: () => void }>(null);
  const [form, setForm] = useState({ username: '', password: '' });

  const rules = {
    username: { required: true, message: 'Username is required', trigger: 'blur' },
    password: { required: true, message: 'Password is required', trigger: 'blur' },
  };

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    try {
      await formRef.current?.validate();
      console.log('Form valid!');
    } catch (e) {
      console.log('Validation failed');
    }
  }

  return (
    <ChronixForm model={form} rules={rules} ref={formRef}>
      <ChronixFormItem label="Username" path="username">
        <CxInput value={form.username} onUpdateValue={(v: string) => updateField('username', v)} />
      </ChronixFormItem>
      <ChronixFormItem label="Password" path="password">
        <CxInput
          value={form.password}
          onUpdateValue={(v: string) => updateField('password', v)}
          type="password"
        />
      </ChronixFormItem>
      <ChronixFormItem>
        <CxButton type="primary" onClick={handleSubmit}>
          Submit
        </CxButton>
      </ChronixFormItem>
    </ChronixForm>
  );
}
```

:::

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
