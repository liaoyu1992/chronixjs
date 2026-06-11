<script setup>
import BadgeBasic from '../../../ui/components/demos/badge/BadgeBasic.vue';
import badgeBasicCode from '../../../ui/components/demos/badge/BadgeBasic.vue?raw';
import badgeBasicVue2 from '../../../ui/components/demos/badge/BadgeBasic.vue2?raw';
import badgeBasicReact from '../../../ui/components/demos/badge/BadgeBasic.react?raw';
import BadgeTypes from '../../../ui/components/demos/badge/BadgeTypes.vue';
import badgeTypesCode from '../../../ui/components/demos/badge/BadgeTypes.vue?raw';
import badgeTypesVue2 from '../../../ui/components/demos/badge/BadgeTypes.vue2?raw';
import badgeTypesReact from '../../../ui/components/demos/badge/BadgeTypes.react?raw';
import BadgeDot from '../../../ui/components/demos/badge/BadgeDot.vue';
import badgeDotCode from '../../../ui/components/demos/badge/BadgeDot.vue?raw';
import badgeDotVue2 from '../../../ui/components/demos/badge/BadgeDot.vue2?raw';
import badgeDotReact from '../../../ui/components/demos/badge/BadgeDot.react?raw';
import BadgeMax from '../../../ui/components/demos/badge/BadgeMax.vue';
import badgeMaxCode from '../../../ui/components/demos/badge/BadgeMax.vue?raw';
import badgeMaxVue2 from '../../../ui/components/demos/badge/BadgeMax.vue2?raw';
import badgeMaxReact from '../../../ui/components/demos/badge/BadgeMax.react?raw';
import BadgeProcessing from '../../../ui/components/demos/badge/BadgeProcessing.vue';
import badgeProcessingCode from '../../../ui/components/demos/badge/BadgeProcessing.vue?raw';
import badgeProcessingVue2 from '../../../ui/components/demos/badge/BadgeProcessing.vue2?raw';
import badgeProcessingReact from '../../../ui/components/demos/badge/BadgeProcessing.react?raw';
</script>

# Badge

Badges display status indicators, counts, or notifications. Can wrap child elements or render standalone.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Badge wrapping a child element with a count." :code="badgeBasicCode" :code-vue2="badgeBasicVue2" :code-react="badgeBasicReact">
  <BadgeBasic />
</DemoBox>

## Badge Types

<DemoBox title="Badge Types" description="Standalone badges with different semantic types." :code="badgeTypesCode" :code-vue2="badgeTypesVue2" :code-react="badgeTypesReact">
  <BadgeTypes />
</DemoBox>

## Dot Mode

<DemoBox title="Dot Mode" description="Use dot prop to show a small dot indicator." :code="badgeDotCode" :code-vue2="badgeDotVue2" :code-react="badgeDotReact">
  <BadgeDot />
</DemoBox>

## Max Value

<DemoBox title="Max Value" description="Use max to truncate large numbers." :code="badgeMaxCode" :code-vue2="badgeMaxVue2" :code-react="badgeMaxReact">
  <BadgeMax />
</DemoBox>

## Processing

<DemoBox title="Processing" description="Use processing prop to add pulse animation." :code="badgeProcessingCode" :code-vue2="badgeProcessingVue2" :code-react="badgeProcessingReact">
  <BadgeProcessing />
</DemoBox>

## API Reference

### Props

| Prop         | Type                                                       | Default     | Description          |
| ------------ | ---------------------------------------------------------- | ----------- | -------------------- |
| `value`      | `number \| string \| undefined`                            | `undefined` | Badge content        |
| `max`        | `number \| undefined`                                      | `undefined` | Truncation threshold |
| `dot`        | `boolean`                                                  | `false`     | Dot indicator mode   |
| `type`       | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Semantic color       |
| `processing` | `boolean`                                                  | `false`     | Pulse animation      |
| `show`       | `boolean`                                                  | `true`      | Toggle visibility    |

### Slots

| Slot      | Description                               |
| --------- | ----------------------------------------- |
| `default` | Wrapped element; omit for standalone mode |
