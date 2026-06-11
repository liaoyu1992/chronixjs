<script setup>
import TabsBasic from '../../../ui/components/demos/tabs/TabsBasic.vue';
import tabsBasicCode from '../../../ui/components/demos/tabs/TabsBasic.vue?raw';
import tabsBasicVue2 from '../../../ui/components/demos/tabs/TabsBasic.vue2?raw';
import tabsBasicReact from '../../../ui/components/demos/tabs/TabsBasic.react?raw';
import TabsCard from '../../../ui/components/demos/tabs/TabsCard.vue';
import tabsCardCode from '../../../ui/components/demos/tabs/TabsCard.vue?raw';
import tabsCardVue2 from '../../../ui/components/demos/tabs/TabsCard.vue2?raw';
import tabsCardReact from '../../../ui/components/demos/tabs/TabsCard.react?raw';
import TabsSegment from '../../../ui/components/demos/tabs/TabsSegment.vue';
import tabsSegmentCode from '../../../ui/components/demos/tabs/TabsSegment.vue?raw';
import tabsSegmentVue2 from '../../../ui/components/demos/tabs/TabsSegment.vue2?raw';
import tabsSegmentReact from '../../../ui/components/demos/tabs/TabsSegment.react?raw';
</script>

# Tabs

A tabbed interface with line, card, and segment variants.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Line-style tabs." :code="tabsBasicCode" :code-vue2="tabsBasicVue2" :code-react="tabsBasicReact">
  <TabsBasic />
</DemoBox>

## Card Type

<DemoBox title="Card Type" description="Use type=&quot;card&quot; for a card-style tab bar." :code="tabsCardCode" :code-vue2="tabsCardVue2" :code-react="tabsCardReact">
  <TabsCard />
</DemoBox>

## Segment Type

<DemoBox title="Segment Type" description="Use type=&quot;segment&quot; for a segmented control style." :code="tabsSegmentCode" :code-vue2="tabsSegmentVue2" :code-react="tabsSegmentReact">
  <TabsSegment />
</DemoBox>

## API Reference

### Props

| Prop        | Type                                     | Default     | Description         |
| ----------- | ---------------------------------------- | ----------- | ------------------- |
| `value`     | `string`                                 | `undefined` | Active tab key      |
| `items`     | `TabItem[]`                              | `[]`        | Tab items           |
| `type`      | `'line' \| 'card' \| 'segment'`          | `'line'`    | Visual variant      |
| `placement` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'`     | Tab bar position    |
| `size`      | `'small' \| 'medium' \| 'large'`         | `'medium'`  | Tab size            |
| `disabled`  | `boolean`                                | `false`     | Disable tabs        |
| `addable`   | `boolean`                                | `false`     | Show add button     |
| `draggable` | `boolean`                                | `false`     | Enable drag reorder |

### Events

| Event          | Payload  | Description        |
| -------------- | -------- | ------------------ |
| `update:value` | `string` | Active tab changed |
