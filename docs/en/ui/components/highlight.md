<script setup>
import HighlightBasic from '../../../ui/components/demos/highlight/HighlightBasic.vue';
import highlightBasicCode from '../../../ui/components/demos/highlight/HighlightBasic.vue?raw';
import highlightBasicVue2 from '../../../ui/components/demos/highlight/HighlightBasic.vue2?raw';
import highlightBasicReact from '../../../ui/components/demos/highlight/HighlightBasic.react?raw';
</script>

# Highlight

Text with substring matching wrapped in `<mark>` elements.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Highlight all matching substrings in text (case-insensitive by default)." :code="highlightBasicCode" :code-vue2="highlightBasicVue2" :code-react="highlightBasicReact">
  <HighlightBasic />
</DemoBox>

## Case Sensitive

::: code-group

```vue [Vue 3]
<template>
  <CxHighlight value="Vue vue VUE" pattern="Vue" :case-sensitive="true" />
</template>

<script setup lang="ts">
import { CxHighlight } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxHighlight value="Vue vue VUE" pattern="Vue" :case-sensitive="true" />
</template>

<script>
import { CxHighlight } from '@chronixjs/ui-vue2';
export default { components: { CxHighlight } };
</script>
```

```tsx [React]
import { CxHighlight } from '@chronixjs/ui-react';

export function App() {
  return <CxHighlight value="Vue vue VUE" pattern="Vue" caseSensitive={true} />;
}
```

:::

## API Reference

### Props

| Prop            | Type      | Default | Description                    |
| --------------- | --------- | ------- | ------------------------------ |
| `value`         | `string`  | `''`    | Full text content              |
| `pattern`       | `string`  | `''`    | Substring to highlight         |
| `caseSensitive` | `boolean` | `false` | Enable case-sensitive matching |
