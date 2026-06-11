<script setup>
import IconWrapperBasic from '../../../ui/components/demos/icon-wrapper/IconWrapperBasic.vue';
import iconWrapperBasicCode from '../../../ui/components/demos/icon-wrapper/IconWrapperBasic.vue?raw';
import iconWrapperBasicVue2 from '../../../ui/components/demos/icon-wrapper/IconWrapperBasic.vue2?raw';
import iconWrapperBasicReact from '../../../ui/components/demos/icon-wrapper/IconWrapperBasic.react?raw';
</script>

# Icon Wrapper

Sizing and coloring wrapper for arbitrary icon content.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Wrap custom content with IconWrapper and set size and color." :code="iconWrapperBasicCode" :code-vue2="iconWrapperBasicVue2" :code-react="iconWrapperBasicReact">
  <IconWrapperBasic />
</DemoBox>

## API Reference

### Props

| Prop    | Type                  | Default     | Description                   |
| ------- | --------------------- | ----------- | ----------------------------- |
| `size`  | `number`              | `24`        | Width + height in px          |
| `color` | `string \| undefined` | `undefined` | CSS color; undefined inherits |

### Slots

| Slot      | Description  |
| --------- | ------------ |
| `default` | Icon content |
