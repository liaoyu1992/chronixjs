<script setup>
import AvatarGroupBasic from './demos/avatar-group/AvatarGroupBasic.vue';
import avatarGroupBasicCode from './demos/avatar-group/AvatarGroupBasic.vue?raw';
import avatarGroupBasicVue2 from './demos/avatar-group/AvatarGroupBasic.vue2?raw';
import avatarGroupBasicReact from './demos/avatar-group/AvatarGroupBasic.react?raw';
</script>

# Avatar Group 头像组

水平排列的重叠头像组，带有溢出 +N 指示器。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="头像组" description="展示 4 个头像，通过 max 限制最大可见数量为 3，超出的显示为 +N。" :code="avatarGroupBasicCode" :code-vue2="avatarGroupBasicVue2" :code-react="avatarGroupBasicReact">
  <AvatarGroupBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性    | 类型                    | 默认值     | 说明                            |
| ------- | ----------------------- | ---------- | ------------------------------- |
| `items` | `readonly AvatarItem[]` | `[]`       | 头像项数组                      |
| `max`   | `number`                | `5`        | 最大可见数量；超出部分显示为 +N |
| `size`  | `number`                | `32`       | 头像大小（像素）                |
| `shape` | `'circle' \| 'square'`  | `'circle'` | 头像形状                        |

### AvatarItem

| 属性   | 类型                  | 说明               |
| ------ | --------------------- | ------------------ |
| `key`  | `string`              | 唯一标识符         |
| `src`  | `string \| undefined` | 图片 URL           |
| `text` | `string \| undefined` | 回退文本首字母缩写 |
