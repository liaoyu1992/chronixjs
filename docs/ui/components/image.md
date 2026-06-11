<script setup>
import ImageBasic from './demos/image/ImageBasic.vue';
import imageBasicCode from './demos/image/ImageBasic.vue?raw';
import imageBasicVue2 from './demos/image/ImageBasic.vue2?raw';
import imageBasicReact from './demos/image/ImageBasic.react?raw';
</script>

# Image 图片

增强的图片组件，支持懒加载、回退和预览功能。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="使用 src 属性设置图片地址。" :code="imageBasicCode" :code-vue2="imageBasicVue2" :code-react="imageBasicReact">
  <ImageBasic />
</DemoBox>

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
