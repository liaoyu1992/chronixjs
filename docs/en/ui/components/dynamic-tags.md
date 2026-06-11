<script setup>
import DynamicTagsBasic from '../../../ui/components/demos/dynamic-tags/DynamicTagsBasic.vue';
import dynamicTagsBasicCode from '../../../ui/components/demos/dynamic-tags/DynamicTagsBasic.vue?raw';
import dynamicTagsBasicVue2 from '../../../ui/components/demos/dynamic-tags/DynamicTagsBasic.vue2?raw';
import dynamicTagsBasicReact from '../../../ui/components/demos/dynamic-tags/DynamicTagsBasic.react?raw';
</script>

# Dynamic Tags

Inline tag editor where the user can add tags by typing and remove them via a close icon.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Dynamic tags starting with Tag 1 and Tag 2." :code="dynamicTagsBasicCode" :code-vue2="dynamicTagsBasicVue2" :code-react="dynamicTagsBasicReact">
  <DynamicTagsBasic />
</DemoBox>

## API Reference

### Props

| Prop       | Type                  | Default     | Description                 |
| ---------- | --------------------- | ----------- | --------------------------- |
| `value`    | `readonly string[]`   | `[]`        | Current tags                |
| `max`      | `number \| undefined` | `undefined` | Maximum number of tags      |
| `closable` | `boolean`             | `true`      | Show close icon on each tag |
| `disabled` | `boolean`             | `false`     | Disable the editor          |

### Events

| Event          | Payload    | Description            |
| -------------- | ---------- | ---------------------- |
| `update:value` | `string[]` | Fires when tags change |
