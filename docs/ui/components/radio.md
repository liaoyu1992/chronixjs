<script setup>
import RadioBasic from './demos/radio/RadioBasic.vue';
import radioBasicCode from './demos/radio/RadioBasic.vue?raw';
import radioBasicVue2 from './demos/radio/RadioBasic.vue2?raw';
import radioBasicReact from './demos/radio/RadioBasic.react?raw';
import RadioDisabled from './demos/radio/RadioDisabled.vue';
import radioDisabledCode from './demos/radio/RadioDisabled.vue?raw';
import radioDisabledVue2 from './demos/radio/RadioDisabled.vue2?raw';
import radioDisabledReact from './demos/radio/RadioDisabled.react?raw';
import RadioError from './demos/radio/RadioError.vue';
import radioErrorCode from './demos/radio/RadioError.vue?raw';
import radioErrorVue2 from './demos/radio/RadioError.vue2?raw';
import radioErrorReact from './demos/radio/RadioError.react?raw';
</script>

# Radio 单选

单选按钮组件，支持分组使用。使用 RadioGroup 从选项列表中进行互斥选择。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="使用 RadioGroup 从选项列表中进行互斥选择。" :code="radioBasicCode" :code-vue2="radioBasicVue2" :code-react="radioBasicReact">
  <RadioBasic />
</DemoBox>

## 禁用选项

<DemoBox title="禁用选项" description="可以禁用单个选项。" :code="radioDisabledCode" :code-vue2="radioDisabledVue2" :code-react="radioDisabledReact">
  <RadioDisabled />
</DemoBox>

## 错误状态

<DemoBox title="错误状态" description="通过 error 属性显示错误提示。" :code="radioErrorCode" :code-vue2="radioErrorVue2" :code-react="radioErrorReact">
  <RadioError />
</DemoBox>

## RadioOption 类型

```typescript
interface RadioOption {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly disabled: boolean;
}
```

## API 参考

### RadioGroup 属性 (Props)

| 属性       | 类型                     | 默认值      | 说明                |
| ---------- | ------------------------ | ----------- | ------------------- |
| `value`    | `string`                 | `''`        | 选中的值（v-model） |
| `options`  | `readonly RadioOption[]` | `[]`        | 可用选项            |
| `disabled` | `boolean`                | `false`     | 禁用整个分组        |
| `error`    | `string`                 | `undefined` | 错误提示信息        |

### RadioGroup 事件 (Events)

| 事件           | 载荷     | 说明                  |
| -------------- | -------- | --------------------- |
| `update:value` | `string` | 选中值变化（v-model） |
