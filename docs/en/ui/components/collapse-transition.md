<script setup>
import CollapseTransitionBasic from '../../../ui/components/demos/collapse-transition/CollapseTransitionBasic.vue';
import collapseTransitionBasicCode from '../../../ui/components/demos/collapse-transition/CollapseTransitionBasic.vue?raw';
import collapseTransitionBasicVue2 from '../../../ui/components/demos/collapse-transition/CollapseTransitionBasic.vue2?raw';
import collapseTransitionBasicReact from '../../../ui/components/demos/collapse-transition/CollapseTransitionBasic.react?raw';
</script>

# Collapse Transition

Height transition wrapper for expand/collapse animations. Used internally by Collapse and exposed for ad-hoc needs.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Toggle content visibility with the show prop." :code="collapseTransitionBasicCode" :code-vue2="collapseTransitionBasicVue2" :code-react="collapseTransitionBasicReact">
  <CollapseTransitionBasic />
</DemoBox>

## API Reference

### Props

| Prop       | Type      | Default | Description                            |
| ---------- | --------- | ------- | -------------------------------------- |
| `show`     | `boolean` | `false` | `true` = expanded, `false` = collapsed |
| `duration` | `number`  | `200`   | Animation duration in ms               |

### Slots

| Slot      | Description           |
| --------- | --------------------- |
| `default` | Content to transition |
