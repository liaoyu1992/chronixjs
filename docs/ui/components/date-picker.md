<script setup>
import DatePickerBasic from './demos/date-picker/DatePickerBasic.vue';
import datePickerBasicCode from './demos/date-picker/DatePickerBasic.vue?raw';
import datePickerBasicVue2 from './demos/date-picker/DatePickerBasic.vue2?raw';
import datePickerBasicReact from './demos/date-picker/DatePickerBasic.react?raw';
</script>

# DatePicker 日期选择器

带有格式控制和日期禁用功能的日期选择日历。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="选择日期。" :code="datePickerBasicCode" :code-vue2="datePickerBasicVue2" :code-react="datePickerBasicReact">
  <DatePickerBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性          | 类型                | 默认值      | 说明                |
| ------------- | ------------------- | ----------- | ------------------- |
| `value`       | `Date \| undefined` | `undefined` | 选中日期（v-model） |
| `placeholder` | `string`            | `''`        | 占位文本            |
| `disabled`    | `boolean`           | `false`     | 禁用选择器          |

### 事件 (Events)

| 事件           | 载荷   | 说明           |
| -------------- | ------ | -------------- |
| `update:value` | `Date` | 日期变化时触发 |
