<script setup>
import GridBasic from '../../../ui/components/demos/grid/GridBasic.vue';
import gridBasicCode from '../../../ui/components/demos/grid/GridBasic.vue?raw';
import gridBasicVue2 from '../../../ui/components/demos/grid/GridBasic.vue2?raw';
import gridBasicReact from '../../../ui/components/demos/grid/GridBasic.react?raw';
</script>

# Grid

CSS Grid 2D layout container with simplified column and gap configuration.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="A 3-column grid with div items." :code="gridBasicCode" :code-vue2="gridBasicVue2" :code-react="gridBasicReact">
  <GridBasic />
</DemoBox>

## API Reference

### Props

| Prop     | Type                            | Default     | Description                                                 |
| -------- | ------------------------------- | ----------- | ----------------------------------------------------------- |
| `cols`   | `number \| string \| undefined` | `undefined` | Column tracks: number → `repeat(N, 1fr)`, string → verbatim |
| `xGap`   | `number \| undefined`           | `undefined` | Column gap in pixels                                        |
| `yGap`   | `number \| undefined`           | `undefined` | Row gap in pixels                                           |
| `inline` | `boolean`                       | `false`     | Use `inline-grid` instead of `grid`                         |

### Slots

| Slot      | Description       |
| --------- | ----------------- |
| `default` | Grid cell content |
