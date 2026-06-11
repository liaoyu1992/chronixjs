<script setup>
import SwitchBasic from '../../../ui/components/demos/switch/SwitchBasic.vue';
import switchBasicCode from '../../../ui/components/demos/switch/SwitchBasic.vue?raw';
import switchBasicVue2 from '../../../ui/components/demos/switch/SwitchBasic.vue2?raw';
import switchBasicReact from '../../../ui/components/demos/switch/SwitchBasic.react?raw';
import SwitchSizes from '../../../ui/components/demos/switch/SwitchSizes.vue';
import switchSizesCode from '../../../ui/components/demos/switch/SwitchSizes.vue?raw';
import switchSizesVue2 from '../../../ui/components/demos/switch/SwitchSizes.vue2?raw';
import switchSizesReact from '../../../ui/components/demos/switch/SwitchSizes.react?raw';
import SwitchDisabled from '../../../ui/components/demos/switch/SwitchDisabled.vue';
import switchDisabledCode from '../../../ui/components/demos/switch/SwitchDisabled.vue?raw';
import switchDisabledVue2 from '../../../ui/components/demos/switch/SwitchDisabled.vue2?raw';
import switchDisabledReact from '../../../ui/components/demos/switch/SwitchDisabled.react?raw';
import SwitchError from '../../../ui/components/demos/switch/SwitchError.vue';
import switchErrorCode from '../../../ui/components/demos/switch/SwitchError.vue?raw';
import switchErrorVue2 from '../../../ui/components/demos/switch/SwitchError.vue2?raw';
import switchErrorReact from '../../../ui/components/demos/switch/SwitchError.react?raw';
</script>

# Switch

Toggle switch component for binary on/off states. Renders a native `<button role="switch">` with ARIA attributes for accessibility.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Toggle switch on and off." :code="switchBasicCode" :code-vue2="switchBasicVue2" :code-react="switchBasicReact">
  <SwitchBasic />
</DemoBox>

## Sizes

<DemoBox title="Sizes" description="Set switch size with the size prop." :code="switchSizesCode" :code-vue2="switchSizesVue2" :code-react="switchSizesReact">
  <SwitchSizes />
</DemoBox>

## Disabled

<DemoBox title="Disabled" description="Disable the switch with the disabled prop." :code="switchDisabledCode" :code-vue2="switchDisabledVue2" :code-react="switchDisabledReact">
  <SwitchDisabled />
</DemoBox>

## Error State

<DemoBox title="Error State" description="Show error message with the error prop." :code="switchErrorCode" :code-vue2="switchErrorVue2" :code-react="switchErrorReact">
  <SwitchError />
</DemoBox>

## Accessibility

The switch renders as `<button type="button" role="switch">` with:

- `aria-checked` reflecting the checked state
- `aria-disabled` when disabled
- Keyboard toggle with Space/Enter

## API Reference

### Props

| Prop       | Type                             | Default     | Description            |
| ---------- | -------------------------------- | ----------- | ---------------------- |
| `checked`  | `boolean`                        | `false`     | On/off state (v-model) |
| `disabled` | `boolean`                        | `false`     | Disable the switch     |
| `size`     | `'small' \| 'medium' \| 'large'` | `'medium'`  | Switch size            |
| `error`    | `string`                         | `undefined` | Error message          |

### Events

| Event            | Payload   | Description             |
| ---------------- | --------- | ----------------------- |
| `update:checked` | `boolean` | State changed (v-model) |
