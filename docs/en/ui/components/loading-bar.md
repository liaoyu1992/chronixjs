<script setup>
import LoadingBarBasic from '../../../ui/components/demos/loading-bar/LoadingBarBasic.vue';
import loadingBarBasicCode from '../../../ui/components/demos/loading-bar/LoadingBarBasic.vue?raw';
import loadingBarBasicVue2 from '../../../ui/components/demos/loading-bar/LoadingBarBasic.vue2?raw';
import loadingBarBasicReact from '../../../ui/components/demos/loading-bar/LoadingBarBasic.react?raw';
</script>

# Loading Bar

An imperative loading bar fixed to the top of the viewport, indicating progress through states.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Control the loading bar through state." :code="loadingBarBasicCode" :code-vue2="loadingBarBasicVue2" :code-react="loadingBarBasicReact">
  <LoadingBarBasic />
</DemoBox>

## API Reference

### LoadingBarState

| Value         | Description                                 |
| ------------- | ------------------------------------------- |
| `'idle'`      | Loading bar is hidden                       |
| `'loading'`   | Loading bar animates across the top         |
| `'finishing'` | Loading bar completes and fades out         |
| `'error'`     | Loading bar shows error color and fades out |
