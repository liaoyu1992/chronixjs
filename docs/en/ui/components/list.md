<script setup>
import ListBasic from '../../../ui/components/demos/list/ListBasic.vue';
import listBasicCode from '../../../ui/components/demos/list/ListBasic.vue?raw';
import listBasicVue2 from '../../../ui/components/demos/list/ListBasic.vue2?raw';
import listBasicReact from '../../../ui/components/demos/list/ListBasic.react?raw';
</script>

# List

Vertical list display for settings, contacts, or file rows with optional prefix/suffix.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="A simple bordered list with 3 items." :code="listBasicCode" :code-vue2="listBasicVue2" :code-react="listBasicReact">
  <ListBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type                             | Default    | Description                |
| ------------- | -------------------------------- | ---------- | -------------------------- |
| `items`       | `readonly ListItem[]`            | `[]`       | Array of list items        |
| `bordered`    | `boolean`                        | `false`    | Show outer border          |
| `hoverable`   | `boolean`                        | `false`    | Highlight items on hover   |
| `showDivider` | `boolean`                        | `true`     | Show divider between items |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'` | Padding scale              |

### ListItem

| Property      | Type                  | Description            |
| ------------- | --------------------- | ---------------------- |
| `key`         | `string`              | Unique key             |
| `title`       | `string`              | Primary title text     |
| `description` | `string \| undefined` | Optional sub-text      |
| `prefix`      | `string \| undefined` | Leading icon/glyph     |
| `suffix`      | `string \| undefined` | Trailing metadata text |
