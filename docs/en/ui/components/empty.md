<script setup>
import EmptyBasic from '../../../ui/components/demos/empty/EmptyBasic.vue';
import emptyBasicCode from '../../../ui/components/demos/empty/EmptyBasic.vue?raw';
import emptyBasicVue2 from '../../../ui/components/demos/empty/EmptyBasic.vue2?raw';
import emptyBasicReact from '../../../ui/components/demos/empty/EmptyBasic.react?raw';
import EmptyDescription from '../../../ui/components/demos/empty/EmptyDescription.vue';
import emptyDescriptionCode from '../../../ui/components/demos/empty/EmptyDescription.vue?raw';
import emptyDescriptionVue2 from '../../../ui/components/demos/empty/EmptyDescription.vue2?raw';
import emptyDescriptionReact from '../../../ui/components/demos/empty/EmptyDescription.react?raw';
import EmptySizes from '../../../ui/components/demos/empty/EmptySizes.vue';
import emptySizesCode from '../../../ui/components/demos/empty/EmptySizes.vue?raw';
import emptySizesVue2 from '../../../ui/components/demos/empty/EmptySizes.vue2?raw';
import emptySizesReact from '../../../ui/components/demos/empty/EmptySizes.react?raw';
</script>

# Empty

Empty state placeholder component with icon and description text.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Simple empty state with default description." :code="emptyBasicCode" :code-vue2="emptyBasicVue2" :code-react="emptyBasicReact">
  <EmptyBasic />
</DemoBox>

## Custom Description

<DemoBox title="Custom Description" description="Set custom description text with the description prop." :code="emptyDescriptionCode" :code-vue2="emptyDescriptionVue2" :code-react="emptyDescriptionReact">
  <EmptyDescription />
</DemoBox>

## Sizes

<DemoBox title="Sizes" description="Control size with the size prop." :code="emptySizesCode" :code-vue2="emptySizesVue2" :code-react="emptySizesReact">
  <EmptySizes />
</DemoBox>

## API Reference

### Props

| Prop          | Type                             | Default     | Description      |
| ------------- | -------------------------------- | ----------- | ---------------- |
| `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`  | Empty state size |
| `description` | `string`                         | `'No data'` | Description text |

### Slots

| Slot      | Description                 |
| --------- | --------------------------- |
| `default` | Extra action area at bottom |
| `icon`    | Custom icon content         |
