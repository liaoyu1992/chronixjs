<script setup>
import AutoCompleteBasic from './demos/auto-complete/AutoCompleteBasic.vue';
import autoCompleteBasicCode from './demos/auto-complete/AutoCompleteBasic.vue?raw';
import autoCompleteBasicVue2 from './demos/auto-complete/AutoCompleteBasic.vue2?raw';
import autoCompleteBasicReact from './demos/auto-complete/AutoCompleteBasic.react?raw';
</script>

# AutoComplete 自动补全

带有输入建议的自动补全输入框组件。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="简单的自动补全，输入时展示匹配选项。" :code="autoCompleteBasicCode" :code-vue2="autoCompleteBasicVue2" :code-react="autoCompleteBasicReact">
  <AutoCompleteBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性          | 类型                             | 默认值     | 说明             |
| ------------- | -------------------------------- | ---------- | ---------------- |
| `value`       | `string`                         | `''`       | 输入框的值       |
| `options`     | `AutoCompleteOption[]`           | `[]`       | 自动补全选项列表 |
| `placeholder` | `string`                         | `''`       | 占位文本         |
| `disabled`    | `boolean`                        | `false`    | 是否禁用         |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'` | 输入框尺寸       |
| `error`       | `boolean`                        | `false`    | 是否显示错误状态 |

### 事件 (Events)

| 事件           | 载荷                 | 说明           |
| -------------- | -------------------- | -------------- |
| `update:value` | `string`             | 值变化时触发   |
| `select`       | `AutoCompleteOption` | 选中选项时触发 |
