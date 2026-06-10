# UI — 快速开始

本指南将引导你在项目中设置 Chronix UI 组件。

## 安装

::: code-group

```bash [Vue 3]
pnpm add @chronixjs/ui-vue3@alpha vue
```

```bash [Vue 2]
pnpm add @chronixjs/ui-vue2@alpha vue@^2.7
```

```bash [React]
pnpm add @chronixjs/ui-react@alpha react@^18 react-dom@^18
```

:::

## 使用组件

从适配器包导入时，所有组件会自动注册，无需全局注册。

::: code-group

```vue [Vue 3]
<template>
  <div style="padding: 24px; display: flex; gap: 12px;">
    <CxButton type="primary">Primary</CxButton>
    <CxButton type="success">Success</CxButton>
    <CxButton type="warning">Warning</CxButton>
    <CxButton type="danger">Danger</CxButton>
    <CxButton>Default</CxButton>
  </div>
</template>

<script setup lang="ts">
import { CxButton } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="padding: 24px; display: flex; gap: 12px;">
    <CxButton type="primary">Primary</CxButton>
    <CxButton type="success">Success</CxButton>
    <CxButton type="warning">Warning</CxButton>
    <CxButton type="danger">Danger</CxButton>
    <CxButton>Default</CxButton>
  </div>
</template>

<script>
import { CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxButton },
};
</script>
```

```tsx [React]
import { CxButton } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ padding: 24, display: 'flex', gap: 12 }}>
      <CxButton type="primary">Primary</CxButton>
      <CxButton type="success">Success</CxButton>
      <CxButton type="warning">Warning</CxButton>
      <CxButton type="danger">Danger</CxButton>
      <CxButton>Default</CxButton>
    </div>
  );
}
```

:::

## 表单组件

::: code-group

```vue [Vue 3]
<template>
  <form @submit.prevent="onSubmit">
    <CxInput v-model="form.name" placeholder="Your name" />
    <CxInput v-model="form.email" placeholder="Email" type="email" />
    <CxCheckbox v-model="form.agree">I agree to the terms</CxCheckbox>
    <CxSelect v-model="form.role" :options="roles" placeholder="Select role" />
    <CxButton type="primary" html-type="submit">Submit</CxButton>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { CxInput, CxCheckbox, CxSelect, CxButton } from '@chronixjs/ui-vue3';

const form = reactive({
  name: '',
  email: '',
  agree: false,
  role: '',
});

const roles = [
  { label: 'Engineer', value: 'engineer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Manager', value: 'manager' },
];

function onSubmit() {
  console.log('Form submitted:', form);
}
</script>
```

```vue [Vue 2]
<template>
  <form @submit.prevent="onSubmit">
    <CxInput v-model="form.name" placeholder="Your name" />
    <CxInput v-model="form.email" placeholder="Email" type="email" />
    <CxCheckbox v-model="form.agree">I agree to the terms</CxCheckbox>
    <CxSelect v-model="form.role" :options="roles" placeholder="Select role" />
    <CxButton type="primary" html-type="submit">Submit</CxButton>
  </form>
</template>

<script>
import { CxInput, CxCheckbox, CxSelect, CxButton } from '@chronixjs/ui-vue2';

export default {
  components: { CxInput, CxCheckbox, CxSelect, CxButton },
  data() {
    return {
      form: { name: '', email: '', agree: false, role: '' },
      roles: [
        { label: 'Engineer', value: 'engineer' },
        { label: 'Designer', value: 'designer' },
        { label: 'Manager', value: 'manager' },
      ],
    };
  },
  methods: {
    onSubmit() {
      console.log('Form submitted:', this.form);
    },
  },
};
</script>
```

```tsx [React]
import { useState } from 'react';
import { CxInput, CxCheckbox, CxSelect, CxButton } from '@chronixjs/ui-react';

const roles = [
  { label: 'Engineer', value: 'engineer' },
  { label: 'Designer', value: 'designer' },
  { label: 'Manager', value: 'manager' },
];

export function App() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    agree: false,
    role: '',
  });

  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        console.log('Submitted:', form);
      }}
    >
      <CxInput
        value={form.name}
        onInput={(v: string) => update('name', v)}
        placeholder="Your name"
      />
      <CxInput
        value={form.email}
        onInput={(v: string) => update('email', v)}
        placeholder="Email"
        type="email"
      />
      <CxCheckbox checked={form.agree} onChange={(v: boolean) => update('agree', v)}>
        I agree to the terms
      </CxCheckbox>
      <CxSelect
        value={form.role}
        onChange={(v: string) => update('role', v)}
        options={roles}
        placeholder="Select role"
      />
      <CxButton type="primary" htmlType="submit">
        Submit
      </CxButton>
    </form>
  );
}
```

:::

## 样式注入

样式通过粘性标记模式自动注入：

- 每个适配器内部调用 `ensureChronix*Styles()`
- 样式通过 `data-chronix-ui="{name}"` 属性去重
- 无需手动导入 CSS

## 下一步

- [主题系统](/ui/theme) — 自定义颜色、尺寸和间距
- [Button](/ui/components/button) — 第一个组件深入教程
