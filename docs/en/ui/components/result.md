<script setup>
import ResultBasic from '../../../ui/components/demos/result/ResultBasic.vue';
import resultBasicCode from '../../../ui/components/demos/result/ResultBasic.vue?raw';
import resultBasicVue2 from '../../../ui/components/demos/result/ResultBasic.vue2?raw';
import resultBasicReact from '../../../ui/components/demos/result/ResultBasic.react?raw';
</script>

# Result

A terminal-state display for operation results and error pages.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Success result display." :code="resultBasicCode" :code-vue2="resultBasicVue2" :code-react="resultBasicReact">
  <ResultBasic />
</DemoBox>

## Status Types

Use the `status` prop to display different result states. Semantic statuses include `info`, `success`, `warning`, and `error`. HTTP status codes `404`, `403`, `500`, and `418` are also supported for error pages.

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxResult status="info" title="Information" description="Here is some useful information." />
    <CxResult status="success" title="Success" description="The operation succeeded." />
    <CxResult status="warning" title="Warning" description="Something needs your attention." />
    <CxResult status="error" title="Error" description="The operation failed." />
    <CxResult status="404" title="404" description="The page you visited does not exist." />
    <CxResult status="403" title="403" description="Sorry, you do not have access." />
    <CxResult status="500" title="500" description="Internal server error." />
    <CxResult status="418" title="418" description="I'm a teapot." />
  </div>
</template>

<script setup lang="ts">
import { CxResult } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; flex-direction: column; gap: 24px;">
    <CxResult status="info" title="Information" description="Here is some useful information." />
    <CxResult status="success" title="Success" description="The operation succeeded." />
    <CxResult status="warning" title="Warning" description="Something needs your attention." />
    <CxResult status="error" title="Error" description="The operation failed." />
    <CxResult status="404" title="404" description="The page you visited does not exist." />
    <CxResult status="403" title="403" description="Sorry, you do not have access." />
    <CxResult status="500" title="500" description="Internal server error." />
    <CxResult status="418" title="418" description="I'm a teapot." />
  </div>
</template>

<script>
import { CxResult } from '@chronixjs/ui-vue2';
export default {
  components: { CxResult },
};
</script>
```

```tsx [React]
import { CxResult } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <CxResult status="info" title="Information" description="Here is some useful information." />
      <CxResult status="success" title="Success" description="The operation succeeded." />
      <CxResult status="warning" title="Warning" description="Something needs your attention." />
      <CxResult status="error" title="Error" description="The operation failed." />
      <CxResult status="404" title="404" description="The page you visited does not exist." />
      <CxResult status="403" title="403" description="Sorry, you do not have access." />
      <CxResult status="500" title="500" description="Internal server error." />
      <CxResult status="418" title="418" description="I'm a teapot." />
    </div>
  );
}
```

:::

## API Reference

### Props

| Prop          | Type                                                                                           | Default     | Description      |
| ------------- | ---------------------------------------------------------------------------------------------- | ----------- | ---------------- |
| `status`      | `'default' \| 'info' \| 'success' \| 'warning' \| 'error' \| '404' \| '403' \| '500' \| '418'` | `'info'`    | Result status    |
| `title`       | `string`                                                                                       | `undefined` | Heading text     |
| `description` | `string`                                                                                       | `undefined` | Sub-heading text |
