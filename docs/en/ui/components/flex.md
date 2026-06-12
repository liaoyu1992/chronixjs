<script setup>
import FlexBasic from '../../../ui/components/demos/flex/FlexBasic.vue';
import flexBasicCode from '../../../ui/components/demos/flex/FlexBasic.vue?raw';
import flexBasicVue2 from '../../../ui/components/demos/flex/FlexBasic.vue2?raw';
import flexBasicReact from '../../../ui/components/demos/flex/FlexBasic.react?raw';
import FlexVertical from '../../../ui/components/demos/flex/FlexVertical.vue';
import flexVerticalCode from '../../../ui/components/demos/flex/FlexVertical.vue?raw';
import flexVerticalVue2 from '../../../ui/components/demos/flex/FlexVertical.vue2?raw';
import flexVerticalReact from '../../../ui/components/demos/flex/FlexVertical.react?raw';
import FlexGap from '../../../ui/components/demos/flex/FlexGap.vue';
import flexGapCode from '../../../ui/components/demos/flex/FlexGap.vue?raw';
import flexGapVue2 from '../../../ui/components/demos/flex/FlexGap.vue2?raw';
import flexGapReact from '../../../ui/components/demos/flex/FlexGap.react?raw';
</script>

# Flex

Flexbox layout container with idiomatic CSS-aligned prop names.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Horizontal layout with 3 buttons using Flex." :code="flexBasicCode" :code-vue2="flexBasicVue2" :code-react="flexBasicReact">
  <FlexBasic />
</DemoBox>

## Column Direction

<DemoBox title="Column Direction" description="Use the direction prop to set column layout." :code="flexVerticalCode" :code-vue2="flexVerticalVue2" :code-react="flexVerticalReact">
  <FlexVertical />
</DemoBox>

## Custom Gap

<DemoBox title="Custom Gap" description="Set a numeric gap value in pixels." :code="flexGapCode" :code-vue2="flexGapVue2" :code-react="flexGapReact">
  <FlexGap />
</DemoBox>

## API Reference

### Props

| Prop        | Type                                                                                               | Default     | Description                         |
| ----------- | -------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------- |
| `direction` | `'row' \| 'column' \| 'row-reverse' \| 'column-reverse'`                                           | `'row'`     | Flexbox direction                   |
| `wrap`      | `'nowrap' \| 'wrap' \| 'wrap-reverse'`                                                             | `'nowrap'`  | Flexbox wrap                        |
| `align`     | `'start' \| 'center' \| 'end' \| 'baseline' \| 'stretch' \| undefined`                             | `undefined` | Cross-axis alignment                |
| `justify`   | `'start' \| 'center' \| 'end' \| 'space-around' \| 'space-between' \| 'space-evenly' \| undefined` | `undefined` | Main-axis justification             |
| `gap`       | `'small' \| 'medium' \| 'large' \| number \| undefined`                                            | `undefined` | Gap between children                |
| `inline`    | `boolean`                                                                                          | `false`     | Use `inline-flex` instead of `flex` |

### Slots

| Slot      | Description   |
| --------- | ------------- |
| `default` | Flex children |
