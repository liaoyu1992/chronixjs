<script setup>
import ModalBasic from '../../../ui/components/demos/modal/ModalBasic.vue';
import modalBasicCode from '../../../ui/components/demos/modal/ModalBasic.vue?raw';
import modalBasicVue2 from '../../../ui/components/demos/modal/ModalBasic.vue2?raw';
import modalBasicReact from '../../../ui/components/demos/modal/ModalBasic.react?raw';
</script>

# Modal

Portal-mounted centered surface with translucent mask, focus trap, body scroll lock, and Escape close.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Click the button to open a modal dialog." :code="modalBasicCode" :code-vue2="modalBasicVue2" :code-react="modalBasicReact">
  <ModalBasic />
</DemoBox>

## API Reference

### Props

| Prop           | Type                   | Default     | Description                               |
| -------------- | ---------------------- | ----------- | ----------------------------------------- |
| `show`         | `boolean \| undefined` | `undefined` | Controlled visibility (v-model)           |
| `title`        | `string \| undefined`  | `undefined` | Modal title                               |
| `mask`         | `boolean`              | `true`      | Show translucent mask backdrop            |
| `maskClosable` | `boolean`              | `true`      | Close on mask click                       |
| `escClosable`  | `boolean`              | `true`      | Close on Escape key                       |
| `width`        | `number \| string`     | `520`       | Panel width (number → px, string → as-is) |
| `disabled`     | `boolean`              | `false`     | Prevent opening                           |

### Events

| Event         | Payload                             | Description                   |
| ------------- | ----------------------------------- | ----------------------------- |
| `update:show` | `boolean`                           | Fires when visibility changes |
| `close`       | `'mask' \| 'esc' \| 'close-button'` | Fires with close reason       |

### Slots

| Slot      | Description                    |
| --------- | ------------------------------ |
| `default` | Modal body content             |
| `header`  | Custom header (replaces title) |
| `footer`  | Bottom action row              |
