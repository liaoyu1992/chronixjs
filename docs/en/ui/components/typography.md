<script setup>
import TypographyBasic from '../../../ui/components/demos/typography/TypographyBasic.vue';
import typographyBasicCode from '../../../ui/components/demos/typography/TypographyBasic.vue?raw';
import typographyBasicVue2 from '../../../ui/components/demos/typography/TypographyBasic.vue2?raw';
import typographyBasicReact from '../../../ui/components/demos/typography/TypographyBasic.react?raw';
</script>

# Typography

A typography component for rendering headings, paragraphs, blockquotes, and text with style controls.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Heading-level typography." :code="typographyBasicCode" :code-vue2="typographyBasicVue2" :code-react="typographyBasicReact">
  <TypographyBasic />
</DemoBox>

### Plain Text

By default, renders a `<span>`:

::: code-group

```vue [Vue 3]
<template>
  <CxTypography>Hello, world!</CxTypography>
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography>Hello, world!</CxTypography>
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return <CxTypography>Hello, world!</CxTypography>;
}
```

:::

### Headings

Set `variant="title"` and `level` (1-6) to render `<h1>` through `<h6>`:

::: code-group

```vue [Vue 3]
<template>
  <CxTypography variant="title" :level="1">Heading 1</CxTypography>
  <CxTypography variant="title" :level="2">Heading 2</CxTypography>
  <CxTypography variant="title" :level="3">Heading 3</CxTypography>
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography variant="title" :level="1">Heading 1</CxTypography>
  <CxTypography variant="title" :level="2">Heading 2</CxTypography>
  <CxTypography variant="title" :level="3">Heading 3</CxTypography>
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return (
    <>
      <CxTypography variant="title" level={1}>
        Heading 1
      </CxTypography>
      <CxTypography variant="title" level={2}>
        Heading 2
      </CxTypography>
      <CxTypography variant="title" level={3}>
        Heading 3
      </CxTypography>
    </>
  );
}
```

:::

### Paragraph

::: code-group

```vue [Vue 3]
<template>
  <CxTypography variant="p">
    This is a paragraph of text that can wrap across multiple lines.
  </CxTypography>
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography variant="p">
    This is a paragraph of text that can wrap across multiple lines.
  </CxTypography>
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTypography variant="p">
      This is a paragraph of text that can wrap across multiple lines.
    </CxTypography>
  );
}
```

:::

## Blockquote

::: code-group

```vue [Vue 3]
<template>
  <CxTypography variant="blockquote">
    The only way to do great work is to love what you do.
  </CxTypography>
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography variant="blockquote">
    The only way to do great work is to love what you do.
  </CxTypography>
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxTypography variant="blockquote">
      The only way to do great work is to love what you do.
    </CxTypography>
  );
}
```

:::

## Horizontal Rule

Renders an `<hr>` separator:

::: code-group

```vue [Vue 3]
<template>
  <CxTypography variant="hr" />
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography variant="hr" />
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return <CxTypography variant="hr" />;
}
```

:::

## Style Modifiers

Apply italic and underline styles to any variant:

::: code-group

```vue [Vue 3]
<template>
  <CxTypography italic>Italic text</CxTypography>
  <CxTypography underline>Underlined text</CxTypography>
  <CxTypography italic underline>Italic & underlined</CxTypography>
</template>

<script setup lang="ts">
import { CxTypography } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxTypography italic>Italic text</CxTypography>
  <CxTypography underline>Underlined text</CxTypography>
  <CxTypography italic underline>Italic & underlined</CxTypography>
</template>

<script>
import { CxTypography } from '@chronixjs/ui-vue2';
export default { components: { CxTypography } };
</script>
```

```tsx [React]
import { CxTypography } from '@chronixjs/ui-react';

export function App() {
  return (
    <>
      <CxTypography italic>Italic text</CxTypography>
      <CxTypography underline>Underlined text</CxTypography>
      <CxTypography italic underline>
        Italic &amp; underlined
      </CxTypography>
    </>
  );
}
```

:::

## API Reference

### Props

| Prop        | Type                                               | Default  | Description                      |
| ----------- | -------------------------------------------------- | -------- | -------------------------------- |
| `variant`   | `'text' \| 'title' \| 'p' \| 'blockquote' \| 'hr'` | `'text'` | HTML element to render           |
| `level`     | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                       | `1`      | Heading level (only for `title`) |
| `italic`    | `boolean`                                          | `false`  | Apply italic style               |
| `underline` | `boolean`                                          | `false`  | Apply underline style            |

### Slots

| Slot      | Description                           |
| --------- | ------------------------------------- |
| `default` | Content to display (ignored for `hr`) |

### Element Mapping

| `variant`    | HTML Element   |
| ------------ | -------------- |
| `text`       | `<span>`       |
| `title`      | `<h{level}>`   |
| `p`          | `<p>`          |
| `blockquote` | `<blockquote>` |
| `hr`         | `<hr>`         |
