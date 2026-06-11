<script setup>
import TimePickerBasic from './demos/time-picker/TimePickerBasic.vue';
import timePickerBasicCode from './demos/time-picker/TimePickerBasic.vue?raw';
import timePickerBasicVue2 from './demos/time-picker/TimePickerBasic.vue2?raw';
import timePickerBasicReact from './demos/time-picker/TimePickerBasic.react?raw';
</script>

# TimePicker 时间选择器

带有可滚动时/分/秒列的时间选择器。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础用法" description="选择时间。" :code="timePickerBasicCode" :code-vue2="timePickerBasicVue2" :code-react="timePickerBasicReact">
  <TimePickerBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性          | 类型                | 默认值      | 说明                |
| ------------- | ------------------- | ----------- | ------------------- |
| `value`       | `Date \| undefined` | `undefined` | 选中时间（v-model） |
| `placeholder` | `string`            | `''`        | 占位文本            |
| `disabled`    | `boolean`           | `false`     | 禁用选择器          |

### 事件 (Events)

| 事件           | 载荷   | 说明           |
| -------------- | ------ | -------------- |
| `update:value` | `Date` | 时间变化时触发 |
