<script setup>
import CalendarBasic from './demos/calendar/CalendarBasic.vue';
import calendarBasicCode from './demos/calendar/CalendarBasic.vue?raw';
import calendarBasicVue2 from './demos/calendar/CalendarBasic.vue2?raw';
import calendarBasicReact from './demos/calendar/CalendarBasic.react?raw';
</script>

# Calendar 日历

独立日历（始终可见，无弹窗），用于日期选择。

## 安装

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## 基础用法

<DemoBox title="基础日历" description="基本的日历组件，点击日期进行选择。" :code="calendarBasicCode" :code-vue2="calendarBasicVue2" :code-react="calendarBasicReact">
  <CalendarBasic />
</DemoBox>

## API 参考

### 属性 (Props)

| 属性             | 类型                      | 默认值      | 说明                   |
| ---------------- | ------------------------- | ----------- | ---------------------- |
| `value`          | `Date \| undefined`       | `undefined` | 当前选中的日期         |
| `disabled`       | `boolean`                 | `false`     | 禁用整个日历           |
| `isDateDisabled` | `(date: Date) => boolean` | `undefined` | 禁用特定日期的回调函数 |

### 事件 (Events)

| 事件           | 载荷                | 说明           |
| -------------- | ------------------- | -------------- |
| `update:value` | `Date \| undefined` | 选择日期时触发 |
