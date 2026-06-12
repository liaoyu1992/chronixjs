<script setup>
import HeatmapBasic from '../../../ui/components/demos/heatmap/HeatmapBasic.vue';
import heatmapBasicCode from '../../../ui/components/demos/heatmap/HeatmapBasic.vue?raw';
import heatmapBasicVue2 from '../../../ui/components/demos/heatmap/HeatmapBasic.vue2?raw';
import heatmapBasicReact from '../../../ui/components/demos/heatmap/HeatmapBasic.react?raw';
</script>

# Heatmap

SVG cell grid with linear color interpolation between two endpoint colors.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="A 7x5 heatmap grid showing value distribution." :code="heatmapBasicCode" :code-vue2="heatmapBasicVue2" :code-react="heatmapBasicReact">
  <HeatmapBasic />
</DemoBox>

## API Reference

### Props

| Prop        | Type                             | Default     | Description                 |
| ----------- | -------------------------------- | ----------- | --------------------------- |
| `cells`     | `readonly (readonly number[])[]` | `[]`        | 2D matrix of numeric values |
| `cellSize`  | `number`                         | `20`        | Cell width + height in px   |
| `colorLow`  | `string`                         | `'#dbeafe'` | Color for min value         |
| `colorHigh` | `string`                         | `'#1e3a8a'` | Color for max value         |
