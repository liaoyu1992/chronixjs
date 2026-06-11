<script setup>
import ButtonBasic from '../../../ui/components/demos/button/ButtonBasic.vue';
import buttonBasicCode from '../../../ui/components/demos/button/ButtonBasic.vue?raw';
import buttonBasicVue2 from '../../../ui/components/demos/button/ButtonBasic.vue2?raw';
import buttonBasicReact from '../../../ui/components/demos/button/ButtonBasic.react?raw';
import ButtonSizes from '../../../ui/components/demos/button/ButtonSizes.vue';
import buttonSizesCode from '../../../ui/components/demos/button/ButtonSizes.vue?raw';
import buttonSizesVue2 from '../../../ui/components/demos/button/ButtonSizes.vue2?raw';
import buttonSizesReact from '../../../ui/components/demos/button/ButtonSizes.react?raw';
import ButtonDisabled from '../../../ui/components/demos/button/ButtonDisabled.vue';
import buttonDisabledCode from '../../../ui/components/demos/button/ButtonDisabled.vue?raw';
import buttonDisabledVue2 from '../../../ui/components/demos/button/ButtonDisabled.vue2?raw';
import buttonDisabledReact from '../../../ui/components/demos/button/ButtonDisabled.react?raw';
import ButtonBlock from '../../../ui/components/demos/button/ButtonBlock.vue';
import buttonBlockCode from '../../../ui/components/demos/button/ButtonBlock.vue?raw';
import buttonBlockVue2 from '../../../ui/components/demos/button/ButtonBlock.vue2?raw';
import buttonBlockReact from '../../../ui/components/demos/button/ButtonBlock.react?raw';
</script>

# Button

A versatile button component with multiple types, sizes, and states.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Basic button usage." :code="buttonBasicCode" :code-vue2="buttonBasicVue2" :code-react="buttonBasicReact">
  <ButtonBasic />
</DemoBox>

## Sizes

<DemoBox title="Sizes" description="Set button size with the size prop." :code="buttonSizesCode" :code-vue2="buttonSizesVue2" :code-react="buttonSizesReact">
  <ButtonSizes />
</DemoBox>

## Disabled

<DemoBox title="Disabled" description="Disable the button with the disabled prop." :code="buttonDisabledCode" :code-vue2="buttonDisabledVue2" :code-react="buttonDisabledReact">
  <ButtonDisabled />
</DemoBox>

## Block

<DemoBox title="Block" description="Full-width block buttons with the block prop." :code="buttonBlockCode" :code-vue2="buttonBlockVue2" :code-react="buttonBlockReact">
  <ButtonBlock />
</DemoBox>

## API Reference

### Props

| Prop       | Type                              | Default     | Description        |
| ---------- | --------------------------------- | ----------- | ------------------ |
| `variant`  | `'default' \| 'primary'`          | `'default'` | Button style type  |
| `size`     | `'small' \| 'medium' \| 'large'`  | `'medium'`  | Button size        |
| `disabled` | `boolean`                         | `false`     | Disable the button |
| `block`    | `boolean`                         | `false`     | Full-width button  |
| `htmlType` | `'button' \| 'submit' \| 'reset'` | `'button'`  | Native button type |

### Events

| Event   | Payload      | Description        |
| ------- | ------------ | ------------------ |
| `click` | `MouseEvent` | Fired when clicked |
