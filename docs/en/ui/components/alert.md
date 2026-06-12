<script setup>
import AlertBasic from '../../../ui/components/demos/alert/AlertBasic.vue';
import alertBasicCode from '../../../ui/components/demos/alert/AlertBasic.vue?raw';
import alertBasicVue2 from '../../../ui/components/demos/alert/AlertBasic.vue2?raw';
import alertBasicReact from '../../../ui/components/demos/alert/AlertBasic.react?raw';
import AlertTypes from '../../../ui/components/demos/alert/AlertTypes.vue';
import alertTypesCode from '../../../ui/components/demos/alert/AlertTypes.vue?raw';
import alertTypesVue2 from '../../../ui/components/demos/alert/AlertTypes.vue2?raw';
import alertTypesReact from '../../../ui/components/demos/alert/AlertTypes.react?raw';
import AlertTitle from '../../../ui/components/demos/alert/AlertTitle.vue';
import alertTitleCode from '../../../ui/components/demos/alert/AlertTitle.vue?raw';
import alertTitleVue2 from '../../../ui/components/demos/alert/AlertTitle.vue2?raw';
import alertTitleReact from '../../../ui/components/demos/alert/AlertTitle.react?raw';
import AlertClosable from '../../../ui/components/demos/alert/AlertClosable.vue';
import alertClosableCode from '../../../ui/components/demos/alert/AlertClosable.vue?raw';
import alertClosableVue2 from '../../../ui/components/demos/alert/AlertClosable.vue2?raw';
import alertClosableReact from '../../../ui/components/demos/alert/AlertClosable.react?raw';
</script>

# Alert

Display important messages with semantic types (info, success, warning, error).

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Basic alert usage." :code="alertBasicCode" :code-vue2="alertBasicVue2" :code-react="alertBasicReact">
  <AlertBasic />
</DemoBox>

## Alert Types

<DemoBox title="Alert Types" description="Set semantic type with the type prop." :code="alertTypesCode" :code-vue2="alertTypesVue2" :code-react="alertTypesReact">
  <AlertTypes />
</DemoBox>

## With Title

<DemoBox title="With Title" description="Add a title with the title prop." :code="alertTitleCode" :code-vue2="alertTitleVue2" :code-react="alertTitleReact">
  <AlertTitle />
</DemoBox>

## Closable

<DemoBox title="Closable" description="Show close button with the closable prop." :code="alertClosableCode" :code-vue2="alertClosableVue2" :code-react="alertClosableReact">
  <AlertClosable />
</DemoBox>

## API Reference

### Props

| Prop       | Type                                                       | Default     | Description       |
| ---------- | ---------------------------------------------------------- | ----------- | ----------------- |
| `type`     | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | Semantic type     |
| `title`    | `string`                                                   | `undefined` | Optional title    |
| `closable` | `boolean`                                                  | `false`     | Show close button |
| `bordered` | `boolean`                                                  | `true`      | Show border       |

### Events

| Event   | Payload      | Description          |
| ------- | ------------ | -------------------- |
| `close` | `MouseEvent` | Fired on close click |

### Slots

| Slot      | Description        |
| --------- | ------------------ |
| `default` | Alert body content |
