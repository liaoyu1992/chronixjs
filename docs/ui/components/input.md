<script setup>
import InputBasic from './demos/input/InputBasic.vue';
import inputBasicCode from './demos/input/InputBasic.vue?raw';
import inputBasicVue2 from './demos/input/InputBasic.vue2?raw';
import inputBasicReact from './demos/input/InputBasic.react?raw';
import InputSizes from './demos/input/InputSizes.vue';
import inputSizesCode from './demos/input/InputSizes.vue?raw';
import inputSizesVue2 from './demos/input/InputSizes.vue2?raw';
import inputSizesReact from './demos/input/InputSizes.react?raw';
import InputClearable from './demos/input/InputClearable.vue';
import inputClearableCode from './demos/input/InputClearable.vue?raw';
import inputClearableVue2 from './demos/input/InputClearable.vue2?raw';
import inputClearableReact from './demos/input/InputClearable.react?raw';
import InputTextarea from './demos/input/InputTextarea.vue';
import inputTextareaCode from './demos/input/InputTextarea.vue?raw';
import inputTextareaVue2 from './demos/input/InputTextarea.vue2?raw';
import inputTextareaReact from './demos/input/InputTextarea.react?raw';
import InputDisabled from './demos/input/InputDisabled.vue';
import inputDisabledCode from './demos/input/InputDisabled.vue?raw';
import inputDisabledVue2 from './demos/input/InputDisabled.vue2?raw';
import inputDisabledReact from './demos/input/InputDisabled.react?raw';
import InputError from './demos/input/InputError.vue';
import inputErrorCode from './demos/input/InputError.vue?raw';
import inputErrorVue2 from './demos/input/InputError.vue2?raw';
import inputErrorReact from './demos/input/InputError.react?raw';
</script>

# Input 输入框

文本输入组件，支持清除、文本域模式、验证和 IME 组合输入处理。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="文本输入的基础用法。" :code="inputBasicCode" :code-vue2="inputBasicVue2" :code-react="inputBasicReact">
  <InputBasic />
</DemoBox>

## 尺寸

<DemoBox title="尺寸" description="通过 size 属性设置输入框尺寸。" :code="inputSizesCode" :code-vue2="inputSizesVue2" :code-react="inputSizesReact">
  <InputSizes />
</DemoBox>

## 文本域

<DemoBox title="文本域" description="设置 type=&quot;textarea&quot; 用于多行输入，通过 rows 设置行数。" :code="inputTextareaCode" :code-vue2="inputTextareaVue2" :code-react="inputTextareaReact">
  <InputTextarea />
</DemoBox>

## 可清除

<DemoBox title="可清除" description="通过 clearable 属性在输入框有值时显示清除按钮。" :code="inputClearableCode" :code-vue2="inputClearableVue2" :code-react="inputClearableReact">
  <InputClearable />
</DemoBox>

## 禁用状态

<DemoBox title="禁用状态" description="通过 disabled 属性禁用输入框。" :code="inputDisabledCode" :code-vue2="inputDisabledVue2" :code-react="inputDisabledReact">
  <InputDisabled />
</DemoBox>

## 错误状态

<DemoBox title="错误状态" description="通过 error 属性显示验证错误信息。" :code="inputErrorCode" :code-vue2="inputErrorVue2" :code-react="inputErrorReact">
  <InputError />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop          | 类型                             | 默认值      | 描述              |
| ------------- | -------------------------------- | ----------- | ----------------- |
| `value`       | `string`                         | `''`        | 输入值（v-model） |
| `type`        | `'text' \| 'textarea'`           | `'text'`    | 输入类型          |
| `placeholder` | `string`                         | `undefined` | 占位文本          |
| `disabled`    | `boolean`                        | `false`     | 是否禁用输入框    |
| `clearable`   | `boolean`                        | `false`     | 是否显示清除按钮  |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | 输入框尺寸        |
| `rows`        | `number`                         | `3`         | 文本域行数        |
| `error`       | `string`                         | `undefined` | 错误信息          |

### 事件 (Events)

| Event          | Payload      | 描述                    |
| -------------- | ------------ | ----------------------- |
| `update:value` | `string`     | 值变化时触发（v-model） |
| `focus`        | `FocusEvent` | 输入框获得焦点时触发    |
| `blur`         | `FocusEvent` | 输入框失去焦点时触发    |
| `clear`        | —            | 清除按钮被点击时触发    |
