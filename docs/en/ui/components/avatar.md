<script setup>
import AvatarBasic from '../../../ui/components/demos/avatar/AvatarBasic.vue';
import avatarBasicCode from '../../../ui/components/demos/avatar/AvatarBasic.vue?raw';
import avatarBasicVue2 from '../../../ui/components/demos/avatar/AvatarBasic.vue2?raw';
import avatarBasicReact from '../../../ui/components/demos/avatar/AvatarBasic.react?raw';
import AvatarImage from '../../../ui/components/demos/avatar/AvatarImage.vue';
import avatarImageCode from '../../../ui/components/demos/avatar/AvatarImage.vue?raw';
import avatarImageVue2 from '../../../ui/components/demos/avatar/AvatarImage.vue2?raw';
import avatarImageReact from '../../../ui/components/demos/avatar/AvatarImage.react?raw';
</script>

# Avatar

An avatar component for displaying user profile images, initials, or fallback content.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Text Avatar" description="When src is not provided or the image fails to load, the avatar displays the text prop as initials." :code="avatarBasicCode" :code-vue2="avatarBasicVue2" :code-react="avatarBasicReact">
  <AvatarBasic />
</DemoBox>

## Image Avatar

<DemoBox title="Image Avatar" description="Set the avatar image URL via the src prop." :code="avatarImageCode" :code-vue2="avatarImageVue2" :code-react="avatarImageReact">
  <AvatarImage />
</DemoBox>

## API Reference

### Props

| Prop    | Type                              | Default     | Description                                       |
| ------- | --------------------------------- | ----------- | ------------------------------------------------- |
| `src`   | `string`                          | `undefined` | Image URL                                         |
| `text`  | `string`                          | `undefined` | Fallback text (e.g. initials) shown when no image |
| `size`  | `number`                          | `40`        | Avatar size in pixels                             |
| `shape` | `'circle' \| 'square' \| 'round'` | `'circle'`  | Avatar shape — circle, square, or rounded corners |

### Slots

| Slot      | Description                                          |
| --------- | ---------------------------------------------------- |
| `default` | Fallback content when no `src` or `text` is provided |

### Render Logic

The avatar follows this priority for display:

1. **Image** — if `src` is provided and the image loads successfully, renders an `<img>`
2. **Text** — if `text` is provided (or image fails), renders the text string
3. **Slot** — if neither `src` nor `text` is available, renders the default slot
