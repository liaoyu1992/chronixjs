<script setup>
import CalendarBasic from '../../../ui/components/demos/calendar/CalendarBasic.vue';
import calendarBasicCode from '../../../ui/components/demos/calendar/CalendarBasic.vue?raw';
import calendarBasicVue2 from '../../../ui/components/demos/calendar/CalendarBasic.vue2?raw';
import calendarBasicReact from '../../../ui/components/demos/calendar/CalendarBasic.react?raw';
</script>

# Calendar

Standalone calendar (always visible, no popup) for date selection.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Calendar" description="A basic calendar component for date selection." :code="calendarBasicCode" :code-vue2="calendarBasicVue2" :code-react="calendarBasicReact">
  <CalendarBasic />
</DemoBox>

## API Reference

### Props

| Prop             | Type                      | Default     | Description                        |
| ---------------- | ------------------------- | ----------- | ---------------------------------- |
| `value`          | `Date \| undefined`       | `undefined` | Currently selected date            |
| `disabled`       | `boolean`                 | `false`     | Disable the entire calendar        |
| `isDateDisabled` | `(date: Date) => boolean` | `undefined` | Callback to disable specific dates |

### Events

| Event          | Payload             | Description                   |
| -------------- | ------------------- | ----------------------------- |
| `update:value` | `Date \| undefined` | Fires when a date is selected |
