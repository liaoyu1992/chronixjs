<script setup>
import TreeBasic from '../../../ui/components/demos/tree/TreeBasic.vue';
import treeBasicCode from '../../../ui/components/demos/tree/TreeBasic.vue?raw';
import treeBasicVue2 from '../../../ui/components/demos/tree/TreeBasic.vue2?raw';
import treeBasicReact from '../../../ui/components/demos/tree/TreeBasic.react?raw';
</script>

# Tree

Hierarchical tree view with expand/collapse, selection, drag-and-drop reorder, virtual scrolling, and async loading.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Tree with nested items and default expand all." :code="treeBasicCode" :code-vue2="treeBasicVue2" :code-react="treeBasicReact">
  <TreeBasic />
</DemoBox>

## API Reference

### Props

| Prop                | Type                                                    | Default     | Description                  |
| ------------------- | ------------------------------------------------------- | ----------- | ---------------------------- |
| `value`             | `string \| undefined`                                   | `undefined` | Selected node key            |
| `items`             | `readonly TreeNodeSpec<TreeNodeData>[]`                 | `[]`        | Tree data                    |
| `expandedKeys`      | `ReadonlySet<string> \| readonly string[] \| undefined` | `undefined` | Controlled expanded keys     |
| `selectable`        | `boolean`                                               | `true`      | Allow node selection         |
| `defaultExpandAll`  | `boolean`                                               | `false`     | Expand all nodes on mount    |
| `draggable`         | `boolean`                                               | `false`     | Enable drag-and-drop reorder |
| `virtual`           | `boolean`                                               | `false`     | Enable virtual scrolling     |
| `virtualItemHeight` | `number`                                                | `28`        | Row height for virtual mode  |
| `height`            | `number \| string \| undefined`                         | `undefined` | Container height             |
| `loadChildren`      | `(node) => Promise<...>`                                | `undefined` | Async children loader        |
| `filter`            | `string \| undefined`                                   | `undefined` | Filter string                |
| `disabled`          | `boolean`                                               | `false`     | Disable the entire tree      |

### TreeNodeData

| Property   | Type                   | Description           |
| ---------- | ---------------------- | --------------------- |
| `label`    | `string`               | Display text          |
| `icon`     | `string \| undefined`  | Optional icon name    |
| `disabled` | `boolean \| undefined` | Disable specific node |
| `isLeaf`   | `boolean \| undefined` | Force leaf node       |

### Events

| Event                 | Payload                             | Description                       |
| --------------------- | ----------------------------------- | --------------------------------- |
| `update:value`        | `string`                            | Fires when selection changes      |
| `update:expandedKeys` | `ReadonlySet<string>`               | Fires when expansion changes      |
| `select`              | `(key: string, node: TreeNodeSpec)` | Fires when a node is selected     |
| `reorder`             | `readonly TreeNodeSpec[]`           | Fires after drag-and-drop reorder |

### TreeNodeSpec

| Property   | Type                         | Description          |
| ---------- | ---------------------------- | -------------------- |
| `key`      | `string \| number`           | Unique identifier    |
| `data`     | `T`                          | User payload         |
| `children` | `readonly TreeNodeSpec<T>[]` | Optional child nodes |
