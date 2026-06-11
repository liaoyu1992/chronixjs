<script setup>
import CollapseBasic from '../../../ui/components/demos/collapse/CollapseBasic.vue';
import collapseBasicCode from '../../../ui/components/demos/collapse/CollapseBasic.vue?raw';
import collapseBasicVue2 from '../../../ui/components/demos/collapse/CollapseBasic.vue2?raw';
import collapseBasicReact from '../../../ui/components/demos/collapse/CollapseBasic.react?raw';
import CollapseAccordion from '../../../ui/components/demos/collapse/CollapseAccordion.vue';
import collapseAccordionCode from '../../../ui/components/demos/collapse/CollapseAccordion.vue?raw';
import collapseAccordionVue2 from '../../../ui/components/demos/collapse/CollapseAccordion.vue2?raw';
import collapseAccordionReact from '../../../ui/components/demos/collapse/CollapseAccordion.react?raw';
</script>

# Collapse

An accordion/multi-expand panel list for toggling content visibility.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Multi-expand collapse panels." :code="collapseBasicCode" :code-vue2="collapseBasicVue2" :code-react="collapseBasicReact">
  <CollapseBasic />
</DemoBox>

## Accordion Mode

<DemoBox title="Accordion Mode" description="Use the accordion prop to allow only one panel to be expanded at a time." :code="collapseAccordionCode" :code-vue2="collapseAccordionVue2" :code-react="collapseAccordionReact">
  <CollapseAccordion />
</DemoBox>

## API Reference

### Props

| Prop             | Type                 | Default     | Description        |
| ---------------- | -------------------- | ----------- | ------------------ |
| `value`          | `string \| string[]` | `undefined` | Expanded key(s)    |
| `items`          | `CollapseItem[]`     | `[]`        | Panel items        |
| `accordion`      | `boolean`            | `false`     | Single expand mode |
| `arrowPlacement` | `'left' \| 'right'`  | `'left'`    | Arrow side         |

### Events

| Event          | Payload                            | Description            |
| -------------- | ---------------------------------- | ---------------------- |
| `update:value` | `string \| string[]`               | Fired when keys change |
| `item-change`  | `(key: string, expanded: boolean)` | Fired on item toggle   |
