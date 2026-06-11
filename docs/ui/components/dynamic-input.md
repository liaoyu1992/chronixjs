<script setup>
import DynamicInputBasic from './demos/dynamic-input/DynamicInputBasic.vue';
import dynamicInputBasicCode from './demos/dynamic-input/DynamicInputBasic.vue?raw';
import dynamicInputBasicVue2 from './demos/dynamic-input/DynamicInputBasic.vue2?raw';
import dynamicInputBasicReact from './demos/dynamic-input/DynamicInputBasic.react?raw';
</script>

# Dynamic Input 动态输入

动态输入值列表，用户可以添加或删除项目。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## 基础用法

<DemoBox title="基础用法" description="动态输入的基础用法，支持添加和删除项目。" :code="dynamicInputBasicCode" :code-vue2="dynamicInputBasicVue2" :code-react="dynamicInputBasicReact">
  <DynamicInputBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop          | 类型                  | 默认值      | 描述                 |
| ------------- | --------------------- | ----------- | -------------------- |
| `value`       | `readonly unknown[]`  | `[]`        | 值数组               |
| `min`         | `number`              | `0`         | 最少项目数           |
| `max`         | `number \| undefined` | `undefined` | 最多项目数           |
| `disabled`    | `boolean`             | `false`     | 禁用所有输入框       |
| `placeholder` | `string`              | `''`        | 每个输入框的占位文本 |

### 事件 (Events)

| Event          | Payload     | 描述           |
| -------------- | ----------- | -------------- |
| `update:value` | `unknown[]` | 项目变化时触发 |
