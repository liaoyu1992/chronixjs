<script setup>
import PopSelectBasic from '../../../ui/components/demos/pop-select/PopSelectBasic.vue';
import popSelectBasicCode from '../../../ui/components/demos/pop-select/PopSelectBasic.vue?raw';
import popSelectBasicVue2 from '../../../ui/components/demos/pop-select/PopSelectBasic.vue2?raw';
import popSelectBasicReact from '../../../ui/components/demos/pop-select/PopSelectBasic.react?raw';
</script>

# Pop Select

Option-list popup surface wrapping Popover for simple single-select from a dropdown.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Click trigger with 3 options." :code="popSelectBasicCode" :code-vue2="popSelectBasicVue2" :code-react="popSelectBasicReact">
  <PopSelectBasic />
</DemoBox>

## API Reference

### Props

| Prop         | Type                         | Default          | Description                 |
| ------------ | ---------------------------- | ---------------- | --------------------------- |
| `value`      | `string \| undefined`        | `undefined`      | Selected option value       |
| `options`    | `readonly PopSelectOption[]` | `[]`             | Available options           |
| `show`       | `boolean \| undefined`       | `undefined`      | Controlled popup visibility |
| `trigger`    | `'click' \| 'hover'`         | `'click'`        | Popup trigger mode          |
| `placement`  | `PopupPlacement`             | `'bottom-start'` | Popup placement             |
| `offset`     | `number`                     | `4`              | Distance from trigger in px |
| `flip`       | `boolean`                    | `true`           | Auto-flip when overflowing  |
| `widthMatch` | `boolean`                    | `false`          | Match trigger width         |
| `disabled`   | `boolean`                    | `false`          | Disable the select          |

### PopSelectOption

| Property   | Type      | Description         |
| ---------- | --------- | ------------------- |
| `key`      | `string`  | Unique identifier   |
| `label`    | `string`  | Display text        |
| `value`    | `string`  | Option value        |
| `disabled` | `boolean` | Disable this option |

### Events

| Event          | Payload   | Description                         |
| -------------- | --------- | ----------------------------------- |
| `update:value` | `string`  | Fires when selection changes        |
| `update:show`  | `boolean` | Fires when popup visibility changes |

### Slots

| Slot      | Description     |
| --------- | --------------- |
| `default` | Trigger element |
