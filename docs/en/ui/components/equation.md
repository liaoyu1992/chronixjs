<script setup>
import EquationBasic from '../../../ui/components/demos/equation/EquationBasic.vue';
import equationBasicCode from '../../../ui/components/demos/equation/EquationBasic.vue?raw';
import equationBasicVue2 from '../../../ui/components/demos/equation/EquationBasic.vue2?raw';
import equationBasicReact from '../../../ui/components/demos/equation/EquationBasic.react?raw';
</script>

# Equation

MathML renderer -- injects markup inside a native `<math>` element.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md

<<< @/snippets/vue2/install-ui.md

<<< @/snippets/react/install-ui.md

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Display the E = mc^2 equation." :code="equationBasicCode" :code-vue2="equationBasicVue2" :code-react="equationBasicReact">
  <EquationBasic />
</DemoBox>

## API Reference

### Props

| Prop      | Type                  | Default    | Description                    |
| --------- | --------------------- | ---------- | ------------------------------ |
| `value`   | `string`              | `''`       | MathML markup string           |
| `display` | `'inline' \| 'block'` | `'inline'` | Display mode (inline or block) |
