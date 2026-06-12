<script setup>
import MentionBasic from '../../../ui/components/demos/mention/MentionBasic.vue';
import mentionBasicCode from '../../../ui/components/demos/mention/MentionBasic.vue?raw';
import mentionBasicVue2 from '../../../ui/components/demos/mention/MentionBasic.vue2?raw';
import mentionBasicReact from '../../../ui/components/demos/mention/MentionBasic.react?raw';
</script>

# Mention

Textarea with `@trigger` detection that opens a Select-style dropdown.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Mention input with @ trigger for mentioning users." :code="mentionBasicCode" :code-vue2="mentionBasicVue2" :code-react="mentionBasicReact">
  <MentionBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type                           | Default          | Description                   |
| ------------- | ------------------------------ | ---------------- | ----------------------------- |
| `value`       | `string`                       | `''`             | Textarea content              |
| `options`     | `readonly SelectOption[]`      | `[]`             | Mentionable options           |
| `trigger`     | `string`                       | `'@'`            | Trigger character             |
| `placement`   | `PopupPlacement`               | `'bottom-start'` | Dropdown placement            |
| `disabled`    | `boolean`                      | `false`          | Disable the textarea          |
| `placeholder` | `string`                       | `''`             | Textarea placeholder          |
| `sources`     | `readonly MentionSource[]`     | `[]`             | Multi-source trigger mappings |
| `filter`      | `MentionFilterFn \| undefined` | `undefined`      | Custom filter function        |

### Events

| Event          | Payload  | Description                       |
| -------------- | -------- | --------------------------------- |
| `update:value` | `string` | Fires when textarea value changes |
