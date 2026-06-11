<script setup>
import IconBasic from '../../../ui/components/demos/icon/IconBasic.vue';
import iconBasicCode from '../../../ui/components/demos/icon/IconBasic.vue?raw';
import iconBasicVue2 from '../../../ui/components/demos/icon/IconBasic.vue2?raw';
import iconBasicReact from '../../../ui/components/demos/icon/IconBasic.react?raw';
</script>

# Icon

SVG icon component powered by a central icon registry.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Use the name prop to specify the icon and size to set dimensions." :code="iconBasicCode" :code-vue2="iconBasicVue2" :code-react="iconBasicReact">
  <IconBasic />
</DemoBox>

## API Reference

### Props

| Prop    | Type     | Default | Description            |
| ------- | -------- | ------- | ---------------------- |
| `name`  | `string` | `''`    | Icon registry name     |
| `size`  | `number` | `16`    | Icon size in pixels    |
| `color` | `string` | `''`    | Icon color (CSS value) |
