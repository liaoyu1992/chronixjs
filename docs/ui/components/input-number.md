<script setup>
import InputNumberBasic from './demos/input-number/InputNumberBasic.vue';
import inputNumberBasicCode from './demos/input-number/InputNumberBasic.vue?raw';
import inputNumberBasicVue2 from './demos/input-number/InputNumberBasic.vue2?raw';
import inputNumberBasicReact from './demos/input-number/InputNumberBasic.react?raw';
import InputNumberDisabled from './demos/input-number/InputNumberDisabled.vue';
import inputNumberDisabledCode from './demos/input-number/InputNumberDisabled.vue?raw';
import inputNumberDisabledVue2 from './demos/input-number/InputNumberDisabled.vue2?raw';
import inputNumberDisabledReact from './demos/input-number/InputNumberDisabled.react?raw';
</script>

# Input Number 数字输入框

带有递增/递减步进按钮的数字输入组件。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="通过 v-model:value 绑定数值，设置步长为 1。" :code="inputNumberBasicCode" :code-vue2="inputNumberBasicVue2" :code-react="inputNumberBasicReact">
  <InputNumberBasic />
</DemoBox>

## 禁用状态

<DemoBox title="禁用状态" description="通过 disabled 属性禁用数字输入框。" :code="inputNumberDisabledCode" :code-vue2="inputNumberDisabledVue2" :code-react="inputNumberDisabledReact">
  <InputNumberDisabled />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop       | 类型                             | 默认值      | 描述           |
| ---------- | -------------------------------- | ----------- | -------------- |
| `value`    | `number \| null`                 | `null`      | 当前值         |
| `min`      | `number`                         | `undefined` | 最小值         |
| `max`      | `number`                         | `undefined` | 最大值         |
| `step`     | `number`                         | `1`         | 递增步长       |
| `disabled` | `boolean`                        | `false`     | 是否禁用输入框 |
| `size`     | `'small' \| 'medium' \| 'large'` | `'medium'`  | 输入框尺寸     |
| `error`    | `string`                         | `undefined` | 错误信息       |

### 事件 (Events)

| Event          | Payload          | 描述                    |
| -------------- | ---------------- | ----------------------- |
| `update:value` | `number \| null` | 值变化时触发（v-model） |
