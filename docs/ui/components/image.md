# Image 图片

增强的图片组件，支持懒加载、回退和预览功能。

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

## 适配方式

使用 `objectFit` 属性控制图片如何适应容器：

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

## 图片预览

使用 `previewable` 属性启用点击灯箱预览：

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

## 回退图片

当源图片加载失败时显示回退图片：

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

## API 参考

### 属性 (Props)

| Prop          | 类型                                                       | 默认值      | 描述                     |
| ------------- | ---------------------------------------------------------- | ----------- | ------------------------ |
| `src`         | `string`                                                   | `''`        | 图片源 URL               |
| `alt`         | `string`                                                   | `undefined` | 替代文本                 |
| `width`       | `number \| string`                                         | `undefined` | 图片宽度                 |
| `height`      | `number \| string`                                         | `undefined` | 图片高度                 |
| `objectFit`   | `'fill' \| 'contain' \| 'cover' \| 'none' \| 'scale-down'` | `'cover'`   | CSS object-fit           |
| `previewable` | `boolean`                                                  | `false`     | 启用灯箱预览             |
| `lazy`        | `boolean`                                                  | `true`      | 原生懒加载               |
| `fallback`    | `string`                                                   | `undefined` | 加载失败时的回退图片地址 |
