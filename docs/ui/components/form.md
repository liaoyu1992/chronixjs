# Form 表单

表单布局组件，支持验证、标签定位和字段级规则。

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

## 标签位置

标签可以放在字段上方（默认）或左侧。

### 顶部标签（默认）

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

### 左侧标签

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

## 行内表单

使用 `inline` 属性将表单项水平排列。

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

## API 参考

### ChronixForm 属性 (Props)

| Prop              | 类型                                                 | 默认值      | 描述             |
| ----------------- | ---------------------------------------------------- | ----------- | ---------------- |
| `model`           | `Record<string, unknown>`                            | `{}`        | 表单数据模型     |
| `rules`           | `Record<string, ValidationRule \| ValidationRule[]>` | `undefined` | 验证规则         |
| `labelPlacement`  | `'left' \| 'top'`                                    | `'top'`     | 标签位置         |
| `labelWidth`      | `number \| string`                                   | `undefined` | 标签宽度         |
| `labelAlign`      | `'left' \| 'right'`                                  | `'left'`    | 标签对齐方式     |
| `inline`          | `boolean`                                            | `false`     | 行内布局         |
| `size`            | `'small' \| 'medium' \| 'large'`                     | `undefined` | 组件尺寸         |
| `disabled`        | `boolean`                                            | `false`     | 禁用所有字段     |
| `showFeedback`    | `boolean`                                            | `true`      | 显示错误信息     |
| `showRequireMark` | `boolean`                                            | `true`      | 显示必填星号标记 |

### ChronixFormItem 属性 (Props)

| Prop           | 类型                                 | 默认值      | 描述             |
| -------------- | ------------------------------------ | ----------- | ---------------- |
| `label`        | `string`                             | `undefined` | 字段标签         |
| `path`         | `string`                             | `undefined` | 模型中的字段路径 |
| `rule`         | `ValidationRule \| ValidationRule[]` | `undefined` | 字段级验证规则   |
| `required`     | `boolean`                            | `false`     | 标记为必填       |
| `showFeedback` | `boolean`                            | `true`      | 显示字段错误信息 |

### 暴露的方法 (Methods)

| Method                | 描述                       |
| --------------------- | -------------------------- |
| `validate()`          | 验证所有字段，返回 Promise |
| `restoreValidation()` | 清除所有验证错误           |

### 插槽 (Slots)

| Slot      | 描述                     |
| --------- | ------------------------ |
| `default` | 字段控件区域（FormItem） |
