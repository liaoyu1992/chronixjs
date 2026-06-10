# Code

Code block with `<pre><code>` rendering. No syntax highlighting in v0.1.0.

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
  <CxCode :value="codeStr" />
</template>

<script setup lang="ts">
import { CxCode } from '@chronixjs/ui-vue3';

const codeStr = 'const greeting = "Hello, Chronix!";\nconsole.log(greeting);';
</script>
```

```vue [Vue 2]
<template>
  <CxCode :value="codeStr" />
</template>

<script>
import { CxCode } from '@chronixjs/ui-vue2';
export default {
  components: { CxCode },
  data() {
    return {
      codeStr: 'const greeting = "Hello, Chronix!";\nconsole.log(greeting);',
    };
  },
};
</script>
```

```tsx [React]
import { CxCode } from '@chronixjs/ui-react';

export function App() {
  const codeStr = 'const greeting = "Hello, Chronix!";\nconsole.log(greeting);';

  return <CxCode value={codeStr} />;
}
```

:::

## Inline Code

::: code-group

```vue [Vue 3]
<template>
  <p>Use <CxCode value="npm install" inline /> to add dependencies.</p>
</template>

<script setup lang="ts">
import { CxCode } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <p>Use <CxCode value="npm install" inline /> to add dependencies.</p>
</template>

<script>
import { CxCode } from '@chronixjs/ui-vue2';
export default { components: { CxCode } };
</script>
```

```tsx [React]
import { CxCode } from '@chronixjs/ui-react';

export function App() {
  return (
    <p>
      Use <CxCode value="npm install" inline /> to add dependencies.
    </p>
  );
}
```

:::

## API Reference

### Props

| Prop     | Type      | Default | Description                            |
| -------- | --------- | ------- | -------------------------------------- |
| `value`  | `string`  | `''`    | Code text content                      |
| `inline` | `boolean` | `false` | Render as inline `<code>` (no `<pre>`) |
