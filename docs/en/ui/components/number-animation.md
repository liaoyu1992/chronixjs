<script setup>
import NumberAnimationBasic from '../../../ui/components/demos/number-animation/NumberAnimationBasic.vue';
import numberAnimationBasicCode from '../../../ui/components/demos/number-animation/NumberAnimationBasic.vue?raw';
import numberAnimationBasicVue2 from '../../../ui/components/demos/number-animation/NumberAnimationBasic.vue2?raw';
import numberAnimationBasicReact from '../../../ui/components/demos/number-animation/NumberAnimationBasic.react?raw';
</script>

# Number Animation

Animated number display that tweens from one value to another over a configurable duration.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Animate from 0 to 10,000 over 2 seconds with thousands separator." :code="numberAnimationBasicCode" :code-vue2="numberAnimationBasicVue2" :code-react="numberAnimationBasicReact">
  <NumberAnimationBasic />
</DemoBox>

## API Reference

### Props

| Prop            | Type      | Default | Description                  |
| --------------- | --------- | ------- | ---------------------------- |
| `from`          | `number`  | `0`     | Start value                  |
| `to`            | `number`  | `0`     | End value                    |
| `duration`      | `number`  | `2000`  | Animation duration in ms     |
| `precision`     | `number`  | `0`     | Decimal precision            |
| `active`        | `boolean` | `true`  | Whether animation is running |
| `showSeparator` | `boolean` | `false` | Show thousands separator     |
| `locale`        | `string`  | —       | Locale for number formatting |
