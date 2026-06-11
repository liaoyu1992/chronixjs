<script setup>
import ProgressBasic from '../../../ui/components/demos/progress/ProgressBasic.vue';
import progressBasicCode from '../../../ui/components/demos/progress/ProgressBasic.vue?raw';
import progressBasicVue2 from '../../../ui/components/demos/progress/ProgressBasic.vue2?raw';
import progressBasicReact from '../../../ui/components/demos/progress/ProgressBasic.react?raw';
import ProgressTypes from '../../../ui/components/demos/progress/ProgressTypes.vue';
import progressTypesCode from '../../../ui/components/demos/progress/ProgressTypes.vue?raw';
import progressTypesVue2 from '../../../ui/components/demos/progress/ProgressTypes.vue2?raw';
import progressTypesReact from '../../../ui/components/demos/progress/ProgressTypes.react?raw';
import ProgressIndicator from '../../../ui/components/demos/progress/ProgressIndicator.vue';
import progressIndicatorCode from '../../../ui/components/demos/progress/ProgressIndicator.vue?raw';
import progressIndicatorVue2 from '../../../ui/components/demos/progress/ProgressIndicator.vue2?raw';
import progressIndicatorReact from '../../../ui/components/demos/progress/ProgressIndicator.react?raw';
import ProgressCustomHeight from '../../../ui/components/demos/progress/ProgressCustomHeight.vue';
import progressCustomHeightCode from '../../../ui/components/demos/progress/ProgressCustomHeight.vue?raw';
import progressCustomHeightVue2 from '../../../ui/components/demos/progress/ProgressCustomHeight.vue2?raw';
import progressCustomHeightReact from '../../../ui/components/demos/progress/ProgressCustomHeight.react?raw';
</script>

# Progress

A linear progress bar with semantic types and configurable display.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Basic usage of the linear progress bar." :code="progressBasicCode" :code-vue2="progressBasicVue2" :code-react="progressBasicReact">
  <ProgressBasic />
</DemoBox>

## Progress Types

<DemoBox title="Progress Types" description="Use type to apply semantic coloring." :code="progressTypesCode" :code-vue2="progressTypesVue2" :code-react="progressTypesReact">
  <ProgressTypes />
</DemoBox>

## Indicator Placement

<DemoBox title="Indicator Placement" description="Control where the percentage text appears." :code="progressIndicatorCode" :code-vue2="progressIndicatorVue2" :code-react="progressIndicatorReact">
  <ProgressIndicator />
</DemoBox>

## Custom Height

<DemoBox title="Custom Height" description="Set the height prop to create thicker or thinner bars." :code="progressCustomHeightCode" :code-vue2="progressCustomHeightVue2" :code-react="progressCustomHeightReact">
  <ProgressCustomHeight />
</DemoBox>

## API Reference

### Props

| Prop                 | Type                                                       | Default     | Description            |
| -------------------- | ---------------------------------------------------------- | ----------- | ---------------------- |
| `type`               | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Progress type          |
| `percentage`         | `number`                                                   | `0`         | Progress value (0-100) |
| `showInfo`           | `boolean`                                                  | `true`      | Show percentage text   |
| `height`             | `number`                                                   | `undefined` | Rail height in px      |
| `indicatorPlacement` | `'inside' \| 'outside'`                                    | `'outside'` | Text placement         |
