<script setup>
import SpinBasic from '../../../ui/components/demos/spin/SpinBasic.vue';
import spinBasicCode from '../../../ui/components/demos/spin/SpinBasic.vue?raw';
import spinBasicVue2 from '../../../ui/components/demos/spin/SpinBasic.vue2?raw';
import spinBasicReact from '../../../ui/components/demos/spin/SpinBasic.react?raw';
import SpinSizes from '../../../ui/components/demos/spin/SpinSizes.vue';
import spinSizesCode from '../../../ui/components/demos/spin/SpinSizes.vue?raw';
import spinSizesVue2 from '../../../ui/components/demos/spin/SpinSizes.vue2?raw';
import spinSizesReact from '../../../ui/components/demos/spin/SpinSizes.react?raw';
</script>

# Spin

Loading state indicator with indeterminate spin animation and optional description.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Loading indicator with description text." :code="spinBasicCode" :code-vue2="spinBasicVue2" :code-react="spinBasicReact">
  <SpinBasic />
</DemoBox>

## Sizes

<DemoBox title="Sizes" description="Set indicator size with the size prop." :code="spinSizesCode" :code-vue2="spinSizesVue2" :code-react="spinSizesReact">
  <SpinSizes />
</DemoBox>

## API Reference

### Props

| Prop          | Type                             | Default     | Description                       |
| ------------- | -------------------------------- | ----------- | --------------------------------- |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | Indicator size                    |
| `show`        | `boolean`                        | `true`      | Toggle visibility (keeps mounted) |
| `description` | `string \| undefined`            | `undefined` | Text below the indicator          |
