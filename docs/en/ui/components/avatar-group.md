<script setup>
import AvatarGroupBasic from '../../../ui/components/demos/avatar-group/AvatarGroupBasic.vue';
import avatarGroupBasicCode from '../../../ui/components/demos/avatar-group/AvatarGroupBasic.vue?raw';
import avatarGroupBasicVue2 from '../../../ui/components/demos/avatar-group/AvatarGroupBasic.vue2?raw';
import avatarGroupBasicReact from '../../../ui/components/demos/avatar-group/AvatarGroupBasic.react?raw';
</script>

# Avatar Group

Horizontal stack of overlapping avatars with overflow +N indicator.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Avatar Group" description="Display 4 avatars with max set to 3, excess shown as +N." :code="avatarGroupBasicCode" :code-vue2="avatarGroupBasicVue2" :code-react="avatarGroupBasicReact">
  <AvatarGroupBasic />
</DemoBox>

## API Reference

### Props

| Prop    | Type                    | Default    | Description                           |
| ------- | ----------------------- | ---------- | ------------------------------------- |
| `items` | `readonly AvatarItem[]` | `[]`       | Array of avatar items                 |
| `max`   | `number`                | `5`        | Max visible items; excess shown as +N |
| `size`  | `number`                | `32`       | Avatar size in px                     |
| `shape` | `'circle' \| 'square'`  | `'circle'` | Avatar shape                          |

### AvatarItem

| Property | Type                  | Description            |
| -------- | --------------------- | ---------------------- |
| `key`    | `string`              | Unique identifier      |
| `src`    | `string \| undefined` | Image URL              |
| `text`   | `string \| undefined` | Fallback text initials |
