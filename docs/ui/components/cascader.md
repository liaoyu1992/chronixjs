<script setup>
import CascaderBasic from './demos/cascader/CascaderBasic.vue';
import cascaderBasicCode from './demos/cascader/CascaderBasic.vue?raw';
import cascaderBasicVue2 from './demos/cascader/CascaderBasic.vue2?raw';
import cascaderBasicReact from './demos/cascader/CascaderBasic.react?raw';
</script>

# Cascader 级联选择

多级级联选择，带有嵌套面板。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="带有嵌套选项的级联选择器。" :code="cascaderBasicCode" :code-vue2="cascaderBasicVue2" :code-react="cascaderBasicReact">
  <CascaderBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性          | 类型               | 默认值      | 说明              |
| ------------- | ------------------ | ----------- | ----------------- |
| `value`       | `string`           | `undefined` | 选中值（v-model） |
| `options`     | `CascaderOption[]` | `[]`        | 级联选项          |
| `placeholder` | `string`           | `''`        | 占位文本          |

### 事件 (Events)

| 事件           | 载荷     | 说明         |
| -------------- | -------- | ------------ |
| `update:value` | `string` | 值变化时触发 |
