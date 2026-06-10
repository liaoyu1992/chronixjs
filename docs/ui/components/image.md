# Image

An enhanced image component with lazy loading, fallback, and preview support.

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
  <CxImage src="https://picsum.photos/200/200" alt="Example" />
</template>

<script setup lang="ts">
import { CxImage } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxImage src="https://picsum.photos/200/200" alt="Example" />
</template>

<script>
import { CxImage } from '@chronixjs/ui-vue2';
export default {
  components: { CxImage },
};
</script>
```

```tsx [React]
import { CxImage } from '@chronixjs/ui-react';

export function App() {
  return <CxImage src="https://picsum.photos/200/200" alt="Example" />;
}
```

:::

## Object Fit

Control how the image fits its container using the `objectFit` prop:

::: code-group

```vue [Vue 3]
<template>
  <div style="display: flex; gap: 16px;">
    <div>
      <p>cover (default)</p>
      <CxImage
        src="https://picsum.photos/200/200"
        alt="Cover"
        :width="150"
        :height="150"
        object-fit="cover"
      />
    </div>
    <div>
      <p>contain</p>
      <CxImage
        src="https://picsum.photos/200/200"
        alt="Contain"
        :width="150"
        :height="150"
        object-fit="contain"
        style="border: 1px solid #ddd;"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CxImage } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <div style="display: flex; gap: 16px;">
    <div>
      <p>cover (default)</p>
      <CxImage
        src="https://picsum.photos/200/200"
        alt="Cover"
        :width="150"
        :height="150"
        object-fit="cover"
      />
    </div>
    <div>
      <p>contain</p>
      <CxImage
        src="https://picsum.photos/200/200"
        alt="Contain"
        :width="150"
        :height="150"
        object-fit="contain"
        style="border: 1px solid #ddd;"
      />
    </div>
  </div>
</template>

<script>
import { CxImage } from '@chronixjs/ui-vue2';
export default {
  components: { CxImage },
};
</script>
```

```tsx [React]
import { CxImage } from '@chronixjs/ui-react';

export function App() {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div>
        <p>cover (default)</p>
        <CxImage
          src="https://picsum.photos/200/200"
          alt="Cover"
          width={150}
          height={150}
          objectFit="cover"
        />
      </div>
      <div>
        <p>contain</p>
        <CxImage
          src="https://picsum.photos/200/200"
          alt="Contain"
          width={150}
          height={150}
          objectFit="contain"
          style={{ border: '1px solid #ddd' }}
        />
      </div>
    </div>
  );
}
```

:::

## Previewable

Enable lightbox preview on click with the `previewable` prop:

::: code-group

```vue [Vue 3]
<template>
  <CxImage src="https://picsum.photos/600/400" alt="Click to preview" :width="300" previewable />
</template>

<script setup lang="ts">
import { CxImage } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxImage src="https://picsum.photos/600/400" alt="Click to preview" :width="300" previewable />
</template>

<script>
import { CxImage } from '@chronixjs/ui-vue2';
export default {
  components: { CxImage },
};
</script>
```

```tsx [React]
import { CxImage } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxImage src="https://picsum.photos/600/400" alt="Click to preview" width={300} previewable />
  );
}
```

:::

## With Fallback

Show a fallback image when the source fails to load:

::: code-group

```vue [Vue 3]
<template>
  <CxImage
    src="/broken-image.jpg"
    alt="Broken"
    fallback="https://picsum.photos/200/200"
    :width="200"
    :height="200"
  />
</template>

<script setup lang="ts">
import { CxImage } from '@chronixjs/ui-vue3';
</script>
```

```vue [Vue 2]
<template>
  <CxImage
    src="/broken-image.jpg"
    alt="Broken"
    fallback="https://picsum.photos/200/200"
    :width="200"
    :height="200"
  />
</template>

<script>
import { CxImage } from '@chronixjs/ui-vue2';
export default {
  components: { CxImage },
};
</script>
```

```tsx [React]
import { CxImage } from '@chronixjs/ui-react';

export function App() {
  return (
    <CxImage
      src="/broken-image.jpg"
      alt="Broken"
      fallback="https://picsum.photos/200/200"
      width={200}
      height={200}
    />
  );
}
```

:::

## API Reference

### Props

| Prop          | Type                                                       | Default     | Description             |
| ------------- | ---------------------------------------------------------- | ----------- | ----------------------- |
| `src`         | `string`                                                   | `''`        | Image source URL        |
| `alt`         | `string`                                                   | `undefined` | Alt text                |
| `width`       | `number \| string`                                         | `undefined` | Image width             |
| `height`      | `number \| string`                                         | `undefined` | Image height            |
| `objectFit`   | `'fill' \| 'contain' \| 'cover' \| 'none' \| 'scale-down'` | `'cover'`   | CSS object-fit          |
| `previewable` | `boolean`                                                  | `false`     | Enable lightbox preview |
| `lazy`        | `boolean`                                                  | `true`      | Native lazy loading     |
| `fallback`    | `string`                                                   | `undefined` | Fallback src on error   |
