<script setup>
import RadioBasic from '../../../ui/components/demos/radio/RadioBasic.vue';
import radioBasicCode from '../../../ui/components/demos/radio/RadioBasic.vue?raw';
import radioBasicVue2 from '../../../ui/components/demos/radio/RadioBasic.vue2?raw';
import radioBasicReact from '../../../ui/components/demos/radio/RadioBasic.react?raw';
import RadioDisabled from '../../../ui/components/demos/radio/RadioDisabled.vue';
import radioDisabledCode from '../../../ui/components/demos/radio/RadioDisabled.vue?raw';
import radioDisabledVue2 from '../../../ui/components/demos/radio/RadioDisabled.vue2?raw';
import radioDisabledReact from '../../../ui/components/demos/radio/RadioDisabled.react?raw';
import RadioError from '../../../ui/components/demos/radio/RadioError.vue';
import radioErrorCode from '../../../ui/components/demos/radio/RadioError.vue?raw';
import radioErrorVue2 from '../../../ui/components/demos/radio/RadioError.vue2?raw';
import radioErrorReact from '../../../ui/components/demos/radio/RadioError.react?raw';
</script>

# Radio

Radio button component with group support. Use RadioGroup for mutually exclusive selections from a list of options.

## Install

::: code-group

<<< @/snippets/vue3/install-ui.md [Vue 3]

<<< @/snippets/vue2/install-ui.md [Vue 2]

<<< @/snippets/react/install-ui.md [React]

:::

## Basic Usage

<DemoBox title="Basic Usage" description="Use RadioGroup for mutually exclusive selections from a list of options." :code="radioBasicCode" :code-vue2="radioBasicVue2" :code-react="radioBasicReact">
  <RadioBasic />
</DemoBox>

## Disabled Options

<DemoBox title="Disabled Options" description="Individual options can be disabled." :code="radioDisabledCode" :code-vue2="radioDisabledVue2" :code-react="radioDisabledReact">
  <RadioDisabled />
</DemoBox>

## Error State

<DemoBox title="Error State" description="Display an error message via the error prop." :code="radioErrorCode" :code-vue2="radioErrorVue2" :code-react="radioErrorReact">
  <RadioError />
</DemoBox>

## RadioOption Type

```typescript
interface RadioOption {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly disabled: boolean;
}
```

## API Reference

### RadioGroup Props

| Prop       | Type                     | Default     | Description              |
| ---------- | ------------------------ | ----------- | ------------------------ |
| `value`    | `string`                 | `''`        | Selected value (v-model) |
| `options`  | `readonly RadioOption[]` | `[]`        | Available options        |
| `disabled` | `boolean`                | `false`     | Disable entire group     |
| `error`    | `string`                 | `undefined` | Error message            |

### RadioGroup Events

| Event          | Payload  | Description                 |
| -------------- | -------- | --------------------------- |
| `update:value` | `string` | Selection changed (v-model) |
