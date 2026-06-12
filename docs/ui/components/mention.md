<script setup>
import MentionBasic from './demos/mention/MentionBasic.vue';
import mentionBasicCode from './demos/mention/MentionBasic.vue?raw';
import mentionBasicVue2 from './demos/mention/MentionBasic.vue2?raw';
import mentionBasicReact from './demos/mention/MentionBasic.react?raw';
</script>

# Mention 提及

带有 `@trigger` 检测的文本域，打开 Select 风格的下拉菜单。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="使用 @ 触发提及功能的输入框。" :code="mentionBasicCode" :code-vue2="mentionBasicVue2" :code-react="mentionBasicReact">
  <MentionBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop          | 类型                           | 默认值           | 描述             |
| ------------- | ------------------------------ | ---------------- | ---------------- |
| `value`       | `string`                       | `''`             | 文本域内容       |
| `options`     | `readonly SelectOption[]`      | `[]`             | 可提及的选项列表 |
| `trigger`     | `string`                       | `'@'`            | 触发字符         |
| `placement`   | `PopupPlacement`               | `'bottom-start'` | 下拉菜单位置     |
| `disabled`    | `boolean`                      | `false`          | 是否禁用文本域   |
| `placeholder` | `string`                       | `''`             | 文本域占位文本   |
| `sources`     | `readonly MentionSource[]`     | `[]`             | 多源触发映射     |
| `filter`      | `MentionFilterFn \| undefined` | `undefined`      | 自定义过滤函数   |

### 事件 (Events)

| Event          | Payload  | 描述               |
| -------------- | -------- | ------------------ |
| `update:value` | `string` | 文本域值变化时触发 |
