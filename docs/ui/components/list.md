<script setup>
import ListBasic from './demos/list/ListBasic.vue';
import listBasicCode from './demos/list/ListBasic.vue?raw';
import listBasicVue2 from './demos/list/ListBasic.vue2?raw';
import listBasicReact from './demos/list/ListBasic.react?raw';
</script>

# List 列表

垂直列表展示组件，适用于设置项、联系人或文件行，支持可选前缀/后缀。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="使用 items 属性传入列表数据，bordered 属性显示边框。" :code="listBasicCode" :code-vue2="listBasicVue2" :code-react="listBasicReact">
  <ListBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop          | 类型                             | 默认值     | 描述                   |
| ------------- | -------------------------------- | ---------- | ---------------------- |
| `items`       | `readonly ListItem[]`            | `[]`       | 列表项数组             |
| `bordered`    | `boolean`                        | `false`    | 是否显示外边框         |
| `hoverable`   | `boolean`                        | `false`    | 悬停时是否高亮项目     |
| `showDivider` | `boolean`                        | `true`     | 是否在项目间显示分隔线 |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'` | 内边距比例             |

### ListItem

| Property      | 类型                  | 描述           |
| ------------- | --------------------- | -------------- |
| `key`         | `string`              | 唯一标识       |
| `title`       | `string`              | 主标题文本     |
| `description` | `string \| undefined` | 可选的副文本   |
| `prefix`      | `string \| undefined` | 前置图标/符号  |
| `suffix`      | `string \| undefined` | 后置元数据文本 |
