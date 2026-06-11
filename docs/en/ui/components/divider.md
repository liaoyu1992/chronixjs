<script setup>
import DividerBasic from '../../../ui/components/demos/divider/DividerBasic.vue';
import dividerBasicCode from '../../../ui/components/demos/divider/DividerBasic.vue?raw';
import dividerBasicVue2 from '../../../ui/components/demos/divider/DividerBasic.vue2?raw';
import dividerBasicReact from '../../../ui/components/demos/divider/DividerBasic.react?raw';
import DividerWithTitle from '../../../ui/components/demos/divider/DividerWithTitle.vue';
import dividerWithTitleCode from '../../../ui/components/demos/divider/DividerWithTitle.vue?raw';
import dividerWithTitleVue2 from '../../../ui/components/demos/divider/DividerWithTitle.vue2?raw';
import dividerWithTitleReact from '../../../ui/components/demos/divider/DividerWithTitle.react?raw';
import DividerVertical from '../../../ui/components/demos/divider/DividerVertical.vue';
import dividerVerticalCode from '../../../ui/components/demos/divider/DividerVertical.vue?raw';
import dividerVerticalVue2 from '../../../ui/components/demos/divider/DividerVertical.vue2?raw';
import dividerVerticalReact from '../../../ui/components/demos/divider/DividerVertical.react?raw';
import DividerDashed from '../../../ui/components/demos/divider/DividerDashed.vue';
import dividerDashedCode from '../../../ui/components/demos/divider/DividerDashed.vue?raw';
import dividerDashedVue2 from '../../../ui/components/demos/divider/DividerDashed.vue2?raw';
import dividerDashedReact from '../../../ui/components/demos/divider/DividerDashed.react?raw';
</script>

# Divider

Visual divider with optional title.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Simple horizontal divider between content blocks." :code="dividerBasicCode" :code-vue2="dividerBasicVue2" :code-react="dividerBasicReact">
  <DividerBasic />
</DemoBox>

## With Title

<DemoBox title="With Title" description="Place title via default slot, control alignment with title-placement." :code="dividerWithTitleCode" :code-vue2="dividerWithTitleVue2" :code-react="dividerWithTitleReact">
  <DividerWithTitle />
</DemoBox>

## Vertical

<DemoBox title="Vertical" description="Use vertical prop for inline vertical dividers." :code="dividerVerticalCode" :code-vue2="dividerVerticalVue2" :code-react="dividerVerticalReact">
  <DividerVertical />
</DemoBox>

## Dashed

<DemoBox title="Dashed" description="Use dashed prop for dashed line style." :code="dividerDashedCode" :code-vue2="dividerDashedVue2" :code-react="dividerDashedReact">
  <DividerDashed />
</DemoBox>

## API Reference

### Props

| Prop             | Type                            | Default    | Description      |
| ---------------- | ------------------------------- | ---------- | ---------------- |
| `vertical`       | `boolean`                       | `false`    | Vertical divider |
| `titlePlacement` | `'left' \| 'center' \| 'right'` | `'center'` | Title placement  |
| `dashed`         | `boolean`                       | `false`    | Dashed style     |

### Slots

| Slot      | Description        |
| --------- | ------------------ |
| `default` | Divider title text |
