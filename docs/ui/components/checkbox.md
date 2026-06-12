<script setup>
import CheckboxBasic from './demos/checkbox/CheckboxBasic.vue';
import checkboxBasicCode from './demos/checkbox/CheckboxBasic.vue?raw';
import checkboxBasicVue2 from './demos/checkbox/CheckboxBasic.vue2?raw';
import checkboxBasicReact from './demos/checkbox/CheckboxBasic.react?raw';
import CheckboxIndeterminate from './demos/checkbox/CheckboxIndeterminate.vue';
import checkboxIndeterminateCode from './demos/checkbox/CheckboxIndeterminate.vue?raw';
import checkboxIndeterminateVue2 from './demos/checkbox/CheckboxIndeterminate.vue2?raw';
import checkboxIndeterminateReact from './demos/checkbox/CheckboxIndeterminate.react?raw';
import CheckboxDisabled from './demos/checkbox/CheckboxDisabled.vue';
import checkboxDisabledCode from './demos/checkbox/CheckboxDisabled.vue?raw';
import checkboxDisabledVue2 from './demos/checkbox/CheckboxDisabled.vue2?raw';
import checkboxDisabledReact from './demos/checkbox/CheckboxDisabled.react?raw';
import CheckboxError from './demos/checkbox/CheckboxError.vue';
import checkboxErrorCode from './demos/checkbox/CheckboxError.vue?raw';
import checkboxErrorVue2 from './demos/checkbox/CheckboxError.vue2?raw';
import checkboxErrorReact from './demos/checkbox/CheckboxError.react?raw';
</script>

# Checkbox 复选框

复选框组件，支持半选状态、标签和校验错误。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="复选框的基础用法。" :code="checkboxBasicCode" :code-vue2="checkboxBasicVue2" :code-react="checkboxBasicReact">
  <CheckboxBasic />
</DemoBox>

## 半选状态

<DemoBox title="半选状态" description="半选状态显示一条横线，适用于全选场景。" :code="checkboxIndeterminateCode" :code-vue2="checkboxIndeterminateVue2" :code-react="checkboxIndeterminateReact">
  <CheckboxIndeterminate />
</DemoBox>

## 禁用状态

<DemoBox title="禁用状态" description="禁用复选框不可点击。" :code="checkboxDisabledCode" :code-vue2="checkboxDisabledVue2" :code-react="checkboxDisabledReact">
  <CheckboxDisabled />
</DemoBox>

## 错误状态

<DemoBox title="错误状态" description="通过 error 属性显示错误提示信息。" :code="checkboxErrorCode" :code-vue2="checkboxErrorVue2" :code-react="checkboxErrorReact">
  <CheckboxError />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性            | 类型      | 默认值      | 说明               |
| --------------- | --------- | ----------- | ------------------ |
| `checked`       | `boolean` | `false`     | 选中状态 (v-model) |
| `indeterminate` | `boolean` | `false`     | 半选状态           |
| `disabled`      | `boolean` | `false`     | 禁用复选框         |
| `label`         | `string`  | `undefined` | 标签文本           |
| `error`         | `string`  | `undefined` | 错误提示信息       |

### 事件 (Events)

| 事件             | 载荷      | 说明                 |
| ---------------- | --------- | -------------------- |
| `update:checked` | `boolean` | 状态变化时 (v-model) |

### 插槽 (Slots)

| 插槽      | 说明                              |
| --------- | --------------------------------- |
| `default` | 自定义标签内容（替代 label 属性） |
