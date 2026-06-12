<script setup>
import TreeSelectBasic from './demos/tree-select/TreeSelectBasic.vue';
import treeSelectBasicCode from './demos/tree-select/TreeSelectBasic.vue?raw';
import treeSelectBasicVue2 from './demos/tree-select/TreeSelectBasic.vue2?raw';
import treeSelectBasicReact from './demos/tree-select/TreeSelectBasic.react?raw';
</script>

# TreeSelect 树选择

带有嵌套树形结构的下拉选择器。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="带有嵌套选项的树形选择器。" :code="treeSelectBasicCode" :code-vue2="treeSelectBasicVue2" :code-react="treeSelectBasicReact">
  <TreeSelectBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性          | 类型         | 默认值      | 说明              |
| ------------- | ------------ | ----------- | ----------------- |
| `value`       | `string`     | `undefined` | 选中值（v-model） |
| `data`        | `TreeNode[]` | `[]`        | 树形数据          |
| `placeholder` | `string`     | `''`        | 占位文本          |

### 事件 (Events)

| 事件           | 载荷     | 说明         |
| -------------- | -------- | ------------ |
| `update:value` | `string` | 值变化时触发 |
