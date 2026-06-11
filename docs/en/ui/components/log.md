<script setup>
import LogBasic from '../../../ui/components/demos/log/LogBasic.vue';
import logBasicCode from '../../../ui/components/demos/log/LogBasic.vue?raw';
import logBasicVue2 from '../../../ui/components/demos/log/LogBasic.vue2?raw';
import logBasicReact from '../../../ui/components/demos/log/LogBasic.react?raw';
</script>

# Log

Terminal-output viewer for CI, deploy, audit-trail, or build-output consumption.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Log output with line numbers." :code="logBasicCode" :code-vue2="logBasicVue2" :code-react="logBasicReact">
  <LogBasic />
</DemoBox>

## API Reference

### Props

| Prop          | Type                  | Default     | Description                                 |
| ------------- | --------------------- | ----------- | ------------------------------------------- |
| `lines`       | `readonly string[]`   | `[]`        | Ordered lines to render                     |
| `lineNumbers` | `boolean`             | `false`     | Show line numbers                           |
| `loading`     | `boolean`             | `false`     | Show "loading..." row below lines           |
| `maxHeight`   | `number \| undefined` | `undefined` | Max height in px (becomes scroll container) |
| `wrapLines`   | `boolean`             | `false`     | Wrap long lines (`pre-wrap` vs `pre`)       |
