<script setup>
import SwitchBasic from './demos/switch/SwitchBasic.vue';
import switchBasicCode from './demos/switch/SwitchBasic.vue?raw';
import switchBasicVue2 from './demos/switch/SwitchBasic.vue2?raw';
import switchBasicReact from './demos/switch/SwitchBasic.react?raw';
import SwitchSizes from './demos/switch/SwitchSizes.vue';
import switchSizesCode from './demos/switch/SwitchSizes.vue?raw';
import switchSizesVue2 from './demos/switch/SwitchSizes.vue2?raw';
import switchSizesReact from './demos/switch/SwitchSizes.react?raw';
import SwitchDisabled from './demos/switch/SwitchDisabled.vue';
import switchDisabledCode from './demos/switch/SwitchDisabled.vue?raw';
import switchDisabledVue2 from './demos/switch/SwitchDisabled.vue2?raw';
import switchDisabledReact from './demos/switch/SwitchDisabled.react?raw';
import SwitchError from './demos/switch/SwitchError.vue';
import switchErrorCode from './demos/switch/SwitchError.vue?raw';
import switchErrorVue2 from './demos/switch/SwitchError.vue2?raw';
import switchErrorReact from './demos/switch/SwitchError.react?raw';
</script>

# Switch 开关

用于开/关二元状态的切换开关组件。渲染为带有 ARIA 无障碍属性的原生 `<button role="switch">`。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="开关的基础用法。" :code="switchBasicCode" :code-vue2="switchBasicVue2" :code-react="switchBasicReact">
  <SwitchBasic />
</DemoBox>

## 尺寸

<DemoBox title="尺寸" description="通过 size 属性设置开关尺寸。" :code="switchSizesCode" :code-vue2="switchSizesVue2" :code-react="switchSizesReact">
  <SwitchSizes />
</DemoBox>

## 禁用状态

<DemoBox title="禁用状态" description="通过 disabled 属性禁用开关。" :code="switchDisabledCode" :code-vue2="switchDisabledVue2" :code-react="switchDisabledReact">
  <SwitchDisabled />
</DemoBox>

## 错误状态

<DemoBox title="错误状态" description="通过 error 属性显示错误提示信息。" :code="switchErrorCode" :code-vue2="switchErrorVue2" :code-react="switchErrorReact">
  <SwitchError />
</DemoBox>

## 无障碍

开关渲染为 `<button type="button" role="switch">`，具有以下特性：

- `aria-checked` 反映选中状态
- 禁用时带有 `aria-disabled`
- 使用 Space/Enter 键切换

## API 参考

### 属性 (Props)

| 属性       | 类型                             | 默认值      | 说明                 |
| ---------- | -------------------------------- | ----------- | -------------------- |
| `checked`  | `boolean`                        | `false`     | 开/关状态（v-model） |
| `disabled` | `boolean`                        | `false`     | 禁用开关             |
| `size`     | `'small' \| 'medium' \| 'large'` | `'medium'`  | 开关尺寸             |
| `error`    | `string`                         | `undefined` | 错误提示信息         |

### 事件 (Events)

| 事件             | 载荷      | 说明                |
| ---------------- | --------- | ------------------- |
| `update:checked` | `boolean` | 状态变化（v-model） |
