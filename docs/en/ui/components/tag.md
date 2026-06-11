<script setup>
import TagBasic from '../../../ui/components/demos/tag/TagBasic.vue';
import tagBasicCode from '../../../ui/components/demos/tag/TagBasic.vue?raw';
import tagBasicVue2 from '../../../ui/components/demos/tag/TagBasic.vue2?raw';
import tagBasicReact from '../../../ui/components/demos/tag/TagBasic.react?raw';
import TagSizes from '../../../ui/components/demos/tag/TagSizes.vue';
import tagSizesCode from '../../../ui/components/demos/tag/TagSizes.vue?raw';
import tagSizesVue2 from '../../../ui/components/demos/tag/TagSizes.vue2?raw';
import tagSizesReact from '../../../ui/components/demos/tag/TagSizes.react?raw';
import TagClosable from '../../../ui/components/demos/tag/TagClosable.vue';
import tagClosableCode from '../../../ui/components/demos/tag/TagClosable.vue?raw';
import tagClosableVue2 from '../../../ui/components/demos/tag/TagClosable.vue2?raw';
import tagClosableReact from '../../../ui/components/demos/tag/TagClosable.react?raw';
import TagRound from '../../../ui/components/demos/tag/TagRound.vue';
import tagRoundCode from '../../../ui/components/demos/tag/TagRound.vue?raw';
import tagRoundVue2 from '../../../ui/components/demos/tag/TagRound.vue2?raw';
import tagRoundReact from '../../../ui/components/demos/tag/TagRound.react?raw';
import TagBordered from '../../../ui/components/demos/tag/TagBordered.vue';
import tagBorderedCode from '../../../ui/components/demos/tag/TagBordered.vue?raw';
import tagBorderedVue2 from '../../../ui/components/demos/tag/TagBordered.vue2?raw';
import tagBorderedReact from '../../../ui/components/demos/tag/TagBordered.react?raw';
import TagDisabled from '../../../ui/components/demos/tag/TagDisabled.vue';
import tagDisabledCode from '../../../ui/components/demos/tag/TagDisabled.vue?raw';
import tagDisabledVue2 from '../../../ui/components/demos/tag/TagDisabled.vue2?raw';
import tagDisabledReact from '../../../ui/components/demos/tag/TagDisabled.react?raw';
</script>

# Tag

Tags are used for labeling, categorization, and small inline markers. They support semantic colors, sizes, closability, and pill-shaped rounding.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Six semantic tag types." :code="tagBasicCode" :code-vue2="tagBasicVue2" :code-react="tagBasicReact">
  <TagBasic />
</DemoBox>

## Sizes

<DemoBox title="Sizes" description="Set tag size with the size prop." :code="tagSizesCode" :code-vue2="tagSizesVue2" :code-react="tagSizesReact">
  <TagSizes />
</DemoBox>

## Closable

<DemoBox title="Closable" description="Show a close button. Listen for the close event to remove tags." :code="tagClosableCode" :code-vue2="tagClosableVue2" :code-react="tagClosableReact">
  <TagClosable />
</DemoBox>

## Round (Pill)

<DemoBox title="Round (Pill)" description="Pill-shaped tags with the round prop." :code="tagRoundCode" :code-vue2="tagRoundVue2" :code-react="tagRoundReact">
  <TagRound />
</DemoBox>

## Bordered

<DemoBox title="Bordered" description="Control border visibility with the bordered prop." :code="tagBorderedCode" :code-vue2="tagBorderedVue2" :code-react="tagBorderedReact">
  <TagBordered />
</DemoBox>

## Disabled

<DemoBox title="Disabled" description="Disable tag interaction with the disabled prop." :code="tagDisabledCode" :code-vue2="tagDisabledVue2" :code-react="tagDisabledReact">
  <TagDisabled />
</DemoBox>

## API Reference

### Props

| Prop       | Type                                                                    | Default     | Description             |
| ---------- | ----------------------------------------------------------------------- | ----------- | ----------------------- |
| `type`     | `'default' \| 'primary' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | Tag style type          |
| `size`     | `'small' \| 'medium' \| 'large'`                                        | `'medium'`  | Tag size                |
| `bordered` | `boolean`                                                               | `true`      | Show border             |
| `round`    | `boolean`                                                               | `false`     | Pill-shaped corners     |
| `closable` | `boolean`                                                               | `false`     | Show close button       |
| `disabled` | `boolean`                                                               | `false`     | Non-interactive + muted |

### Events

| Event   | Payload      | Description          |
| ------- | ------------ | -------------------- |
| `close` | `MouseEvent` | Close button clicked |
