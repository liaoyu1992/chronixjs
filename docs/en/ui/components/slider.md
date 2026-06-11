<script setup>
import SliderBasic from '../../../ui/components/demos/slider/SliderBasic.vue';
import sliderBasicCode from '../../../ui/components/demos/slider/SliderBasic.vue?raw';
import sliderBasicVue2 from '../../../ui/components/demos/slider/SliderBasic.vue2?raw';
import sliderBasicReact from '../../../ui/components/demos/slider/SliderBasic.react?raw';
import SliderRange from '../../../ui/components/demos/slider/SliderRange.vue';
import sliderRangeCode from '../../../ui/components/demos/slider/SliderRange.vue?raw';
import sliderRangeVue2 from '../../../ui/components/demos/slider/SliderRange.vue2?raw';
import sliderRangeReact from '../../../ui/components/demos/slider/SliderRange.react?raw';
import SliderDisabled from '../../../ui/components/demos/slider/SliderDisabled.vue';
import sliderDisabledCode from '../../../ui/components/demos/slider/SliderDisabled.vue?raw';
import sliderDisabledVue2 from '../../../ui/components/demos/slider/SliderDisabled.vue2?raw';
import sliderDisabledReact from '../../../ui/components/demos/slider/SliderDisabled.react?raw';
</script>

# Slider

Single or range slider with optional marks and tooltips.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="A basic slider example." :code="sliderBasicCode" :code-vue2="sliderBasicVue2" :code-react="sliderBasicReact">
  <SliderBasic />
</DemoBox>

## Range Mode

<DemoBox title="Range Mode" description="Use the range prop to enable dual-handle range mode." :code="sliderRangeCode" :code-vue2="sliderRangeVue2" :code-react="sliderRangeReact">
  <SliderRange />
</DemoBox>

## Disabled

<DemoBox title="Disabled" description="A disabled slider is not interactive." :code="sliderDisabledCode" :code-vue2="sliderDisabledVue2" :code-react="sliderDisabledReact">
  <SliderDisabled />
</DemoBox>

## API Reference

### Props

| Prop       | Type                         | Default | Description                      |
| ---------- | ---------------------------- | ------- | -------------------------------- |
| `value`    | `number \| [number, number]` | `0`     | Current value (single or range)  |
| `range`    | `boolean`                    | `false` | Enable dual-handle range mode    |
| `min`      | `number`                     | `0`     | Minimum value                    |
| `max`      | `number`                     | `100`   | Maximum value                    |
| `step`     | `number`                     | `1`     | Step between values              |
| `marks`    | `Record<number, SliderMark>` | `{}`    | Labeled marks at specific values |
| `disabled` | `boolean`                    | `false` | Disable the slider               |
| `tooltip`  | `boolean`                    | `true`  | Show tooltip on hover            |
| `vertical` | `boolean`                    | `false` | Vertical orientation             |

### Events

| Event          | Payload                      | Description              |
| -------------- | ---------------------------- | ------------------------ |
| `update:value` | `number \| [number, number]` | Fires when value changes |
