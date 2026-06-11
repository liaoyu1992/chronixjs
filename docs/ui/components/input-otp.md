<script setup>
import InputOTPBasic from './demos/input-otp/InputOTPBasic.vue';
import inputOTPBasicCode from './demos/input-otp/InputOTPBasic.vue?raw';
import inputOTPBasicVue2 from './demos/input-otp/InputOTPBasic.vue2?raw';
import inputOTPBasicReact from './demos/input-otp/InputOTPBasic.react?raw';
</script>

# Input OTP 验证码输入

一次性密码输入组件，包含 N 个独立单元格共享一个受控值。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="设置 length 为 6 的验证码输入。" :code="inputOTPBasicCode" :code-vue2="inputOTPBasicVue2" :code-react="inputOTPBasicReact">
  <InputOTPBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| Prop       | 类型                  | 默认值      | 描述           |
| ---------- | --------------------- | ----------- | -------------- |
| `value`    | `string`              | `''`        | 当前 OTP 值    |
| `length`   | `number`              | `6`         | 输入单元格数量 |
| `disabled` | `boolean`             | `false`     | 禁用所有单元格 |
| `error`    | `string \| undefined` | `undefined` | 错误信息       |

### 事件 (Events)

| Event          | Payload  | 描述                       |
| -------------- | -------- | -------------------------- |
| `update:value` | `string` | 值变化时触发               |
| `complete`     | `string` | 值长度等于 `length` 时触发 |
