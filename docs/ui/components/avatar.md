<script setup>
import AvatarBasic from './demos/avatar/AvatarBasic.vue';
import avatarBasicCode from './demos/avatar/AvatarBasic.vue?raw';
import avatarBasicVue2 from './demos/avatar/AvatarBasic.vue2?raw';
import avatarBasicReact from './demos/avatar/AvatarBasic.react?raw';
import AvatarImage from './demos/avatar/AvatarImage.vue';
import avatarImageCode from './demos/avatar/AvatarImage.vue?raw';
import avatarImageVue2 from './demos/avatar/AvatarImage.vue2?raw';
import avatarImageReact from './demos/avatar/AvatarImage.react?raw';
</script>

# Avatar 头像

用于展示用户头像图片、首字母缩写或回退内容的头像组件。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="文字头像" description="当未提供 src 或图片加载失败时，头像会显示 text 属性作为首字母缩写。" :code="avatarBasicCode" :code-vue2="avatarBasicVue2" :code-react="avatarBasicReact">
  <AvatarBasic />
</DemoBox>

## 图片头像

<DemoBox title="图片头像" description="通过 src 属性设置头像图片地址。" :code="avatarImageCode" :code-vue2="avatarImageVue2" :code-react="avatarImageReact">
  <AvatarImage />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性    | 类型                              | 默认值      | 说明                                   |
| ------- | --------------------------------- | ----------- | -------------------------------------- |
| `src`   | `string`                          | `undefined` | 图片 URL                               |
| `text`  | `string`                          | `undefined` | 回退文本（如首字母缩写），无图片时显示 |
| `size`  | `number`                          | `40`        | 头像大小（像素）                       |
| `shape` | `'circle' \| 'square' \| 'round'` | `'circle'`  | 头像形状 — 圆形、方形或圆角            |

### 插槽 (Slots)

| 插槽      | 说明                                |
| --------- | ----------------------------------- |
| `default` | 未提供 `src` 或 `text` 时的回退内容 |

### 渲染逻辑

头像的显示遵循以下优先级：

1. **图片** — 如果提供了 `src` 且图片加载成功，渲染 `<img>`
2. **文字** — 如果提供了 `text`（或图片加载失败），渲染文字字符串
3. **插槽** — 如果 `src` 和 `text` 均不可用，渲染默认插槽
