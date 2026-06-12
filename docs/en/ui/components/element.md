<script setup>
import ElementBasic from '../../../ui/components/demos/element/ElementBasic.vue';
import elementBasicCode from '../../../ui/components/demos/element/ElementBasic.vue?raw';
import elementBasicVue2 from '../../../ui/components/demos/element/ElementBasic.vue2?raw';
import elementBasicReact from '../../../ui/components/demos/element/ElementBasic.react?raw';
</script>

# Element

Generic Chronix-themed HTML element wrapper with configurable tag.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Render a section element with the tag prop." :code="elementBasicCode" :code-vue2="elementBasicVue2" :code-react="elementBasicReact">
  <ElementBasic />
</DemoBox>

## API Reference

### Props

| Prop     | Type      | Default  | Description               |
| -------- | --------- | -------- | ------------------------- |
| `tag`    | `string`  | `'span'` | HTML tag to render        |
| `inline` | `boolean` | `false`  | Display as inline element |

### Slots

| Slot      | Description     |
| --------- | --------------- |
| `default` | Element content |
