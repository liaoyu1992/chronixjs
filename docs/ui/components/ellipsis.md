# Ellipsis

Text truncation with native HTML `title` tooltip and configurable line clamp.

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
  <CxEllipsis :content="longText" />
</template>

<script setup lang="ts">
import { CxEllipsis } from '@chronixjs/ui-vue3';

const longText =
  'This is a very long text that will be truncated with an ellipsis when it overflows the container width.';
</script>
```

```vue [Vue 2]
<template>
  <CxEllipsis :content="longText" />
</template>

<script>
import { CxEllipsis } from '@chronixjs/ui-vue2';
export default {
  components: { CxEllipsis },
  data() {
    return {
      longText:
        'This is a very long text that will be truncated with an ellipsis when it overflows the container width.',
    };
  },
};
</script>
```

```tsx [React]
import { CxEllipsis } from '@chronixjs/ui-react';

export function App() {
  const longText =
    'This is a very long text that will be truncated with an ellipsis when it overflows the container width.';

  return <CxEllipsis content={longText} />;
}
```

:::

## Multi-line

::: code-group

```vue [Vue 3]
<template>
  <CxEllipsis :content="longText" :line-clamp="3" />
</template>

<script setup lang="ts">
import { CxEllipsis } from '@chronixjs/ui-vue3';

const longText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';
</script>
```

```vue [Vue 2]
<template>
  <CxEllipsis :content="longText" :line-clamp="3" />
</template>

<script>
import { CxEllipsis } from '@chronixjs/ui-vue2';
export default {
  components: { CxEllipsis },
  data() {
    return {
      longText:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
    };
  },
};
</script>
```

```tsx [React]
import { CxEllipsis } from '@chronixjs/ui-react';

export function App() {
  const longText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

  return <CxEllipsis content={longText} lineClamp={3} />;
}
```

:::

## API Reference

### Props

| Prop        | Type      | Default | Description                                |
| ----------- | --------- | ------- | ------------------------------------------ |
| `content`   | `string`  | `''`    | Full text to display                       |
| `tooltip`   | `boolean` | `true`  | Show native `title` tooltip with full text |
| `lineClamp` | `number`  | `1`     | Number of visible lines before truncation  |
