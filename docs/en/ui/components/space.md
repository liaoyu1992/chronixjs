<script setup>
import SpaceBasic from '../../../ui/components/demos/space/SpaceBasic.vue';
import spaceBasicCode from '../../../ui/components/demos/space/SpaceBasic.vue?raw';
import spaceBasicVue2 from '../../../ui/components/demos/space/SpaceBasic.vue2?raw';
import spaceBasicReact from '../../../ui/components/demos/space/SpaceBasic.react?raw';
import SpaceVertical from '../../../ui/components/demos/space/SpaceVertical.vue';
import spaceVerticalCode from '../../../ui/components/demos/space/SpaceVertical.vue?raw';
import spaceVerticalVue2 from '../../../ui/components/demos/space/SpaceVertical.vue2?raw';
import spaceVerticalReact from '../../../ui/components/demos/space/SpaceVertical.react?raw';
import SpaceSizes from '../../../ui/components/demos/space/SpaceSizes.vue';
import spaceSizesCode from '../../../ui/components/demos/space/SpaceSizes.vue?raw';
import spaceSizesVue2 from '../../../ui/components/demos/space/SpaceSizes.vue2?raw';
import spaceSizesReact from '../../../ui/components/demos/space/SpaceSizes.react?raw';
</script>

# Space

One-dimensional layout primitive for consistent spacing between elements.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Horizontal layout of child elements." :code="spaceBasicCode" :code-vue2="spaceBasicVue2" :code-react="spaceBasicReact">
  <SpaceBasic />
</DemoBox>

## Vertical

<DemoBox title="Vertical" description="Use vertical prop to stack children vertically." :code="spaceVerticalCode" :code-vue2="spaceVerticalVue2" :code-react="spaceVerticalReact">
  <SpaceVertical />
</DemoBox>

## Sizes

<DemoBox title="Sizes" description="Use size prop for preset spacing." :code="spaceSizesCode" :code-vue2="spaceSizesVue2" :code-react="spaceSizesReact">
  <SpaceSizes />
</DemoBox>

## API Reference

### Props

| Prop       | Type                                                                                  | Default     | Description      |
| ---------- | ------------------------------------------------------------------------------------- | ----------- | ---------------- |
| `size`     | `'small' \| 'medium' \| 'large' \| number`                                            | `'medium'`  | Spacing size     |
| `vertical` | `boolean`                                                                             | `false`     | Vertical layout  |
| `wrap`     | `boolean`                                                                             | `true`      | Wrap children    |
| `align`    | `'start' \| 'center' \| 'end' \| 'baseline' \| 'stretch'`                             | `undefined` | Cross-axis align |
| `justify`  | `'start' \| 'center' \| 'end' \| 'space-around' \| 'space-between' \| 'space-evenly'` | `undefined` | Main-axis align  |
| `inline`   | `boolean`                                                                             | `false`     | Inline flex mode |
