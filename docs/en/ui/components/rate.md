<script setup>
import RateBasic from '../../../ui/components/demos/rate/RateBasic.vue';
import rateBasicCode from '../../../ui/components/demos/rate/RateBasic.vue?raw';
import rateBasicVue2 from '../../../ui/components/demos/rate/RateBasic.vue2?raw';
import rateBasicReact from '../../../ui/components/demos/rate/RateBasic.react?raw';
import RateHalf from '../../../ui/components/demos/rate/RateHalf.vue';
import rateHalfCode from '../../../ui/components/demos/rate/RateHalf.vue?raw';
import rateHalfVue2 from '../../../ui/components/demos/rate/RateHalf.vue2?raw';
import rateHalfReact from '../../../ui/components/demos/rate/RateHalf.react?raw';
import RateReadonly from '../../../ui/components/demos/rate/RateReadonly.vue';
import rateReadonlyCode from '../../../ui/components/demos/rate/RateReadonly.vue?raw';
import rateReadonlyVue2 from '../../../ui/components/demos/rate/RateReadonly.vue2?raw';
import rateReadonlyReact from '../../../ui/components/demos/rate/RateReadonly.react?raw';
import RateCustomCount from '../../../ui/components/demos/rate/RateCustomCount.vue';
import rateCustomCountCode from '../../../ui/components/demos/rate/RateCustomCount.vue?raw';
import rateCustomCountVue2 from '../../../ui/components/demos/rate/RateCustomCount.vue2?raw';
import rateCustomCountReact from '../../../ui/components/demos/rate/RateCustomCount.react?raw';
</script>

# Rate

Star rating input with optional half-star precision.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Basic star rating usage." :code="rateBasicCode" :code-vue2="rateBasicVue2" :code-react="rateBasicReact">
  <RateBasic />
</DemoBox>

## Half Star

<DemoBox title="Half Star" description="Enable half-star precision with the allow-half prop." :code="rateHalfCode" :code-vue2="rateHalfVue2" :code-react="rateHalfReact">
  <RateHalf />
</DemoBox>

## Read Only

<DemoBox title="Read Only" description="Use the readonly prop for display-only ratings." :code="rateReadonlyCode" :code-vue2="rateReadonlyVue2" :code-react="rateReadonlyReact">
  <RateReadonly />
</DemoBox>

## Custom Count

<DemoBox title="Custom Count" description="Use the count prop to display more stars." :code="rateCustomCountCode" :code-vue2="rateCustomCountVue2" :code-react="rateCustomCountReact">
  <RateCustomCount />
</DemoBox>

## API Reference

### Props

| Prop        | Type      | Default     | Description         |
| ----------- | --------- | ----------- | ------------------- |
| `value`     | `number`  | `0`         | Current rating      |
| `count`     | `number`  | `5`         | Number of stars     |
| `allowHalf` | `boolean` | `false`     | Half-star precision |
| `disabled`  | `boolean` | `false`     | Disable interaction |
| `readonly`  | `boolean` | `false`     | Read-only display   |
| `error`     | `string`  | `undefined` | Error message       |

### Events

| Event          | Payload  | Description    |
| -------------- | -------- | -------------- |
| `update:value` | `number` | Rating changed |
