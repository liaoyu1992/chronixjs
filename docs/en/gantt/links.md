# Links & Dependencies

Dependency links connect bars to visualize task relationships. Links render as SVG paths with configurable routing and arrow markers.

## LinkSpec

Each link is defined by a `LinkSpec` object:

```typescript
import type { LinkSpec } from '@chronixjs/gantt';

const links: LinkSpec[] = [
  {
    id: 'link-1',
    fromBarId: 'bar-1',
    toBarId: 'bar-2',
    routing: 'square',
    marker: 'arrow',
  },
];
```

| Field           | Type                             | Required | Description            |
| --------------- | -------------------------------- | -------- | ---------------------- |
| `id`            | `string`                         | ✅       | Unique link identifier |
| `fromBarId`     | `string`                         | ✅       | Source bar ID          |
| `toBarId`       | `string`                         | ✅       | Target bar ID          |
| `routing`       | `'square' \| 'smooth'`           | ✅       | Path routing style     |
| `marker`        | `LinkMarker \| CustomLinkMarker` | ✅       | Arrow / end marker     |
| `colorOverride` | `string`                         |          | Override link color    |

## Basic Usage

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" :links="links" />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, LinkSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-12'), end: new Date('2026-01-20') },
    dprIntent: 'crisp-pixel',
  },
];

const rows: RowSpec[] = [
  { id: 'row-1', columns: { name: 'Design' } },
  { id: 'row-2', columns: { name: 'Develop' } },
];

// Finish-to-Start: bar-2 starts after bar-1 finishes
const links: LinkSpec[] = [
  {
    id: 'link-1',
    fromBarId: 'bar-1',
    toBarId: 'bar-2',
    routing: 'square',
    marker: 'arrow',
  },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: new Date('2026-01-05'),
  viewportWidth: 900,
  locale: 'en',
  weekendsVisible: true,
};
</script>
```

```vue [Vue 2]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" :links="links" />
</template>

<script>
import { ChronixGantt } from '@chronixjs/gantt-vue2';

export default {
  components: { ChronixGantt },
  data() {
    return {
      bars: [
        {
          id: 'bar-1',
          rowId: 'row-1',
          range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
          dprIntent: 'crisp-pixel',
        },
        {
          id: 'bar-2',
          rowId: 'row-2',
          range: { start: new Date('2026-01-12'), end: new Date('2026-01-20') },
          dprIntent: 'crisp-pixel',
        },
      ],
      rows: [
        { id: 'row-1', columns: { name: 'Design' } },
        { id: 'row-2', columns: { name: 'Develop' } },
      ],
      links: [
        { id: 'link-1', fromBarId: 'bar-1', toBarId: 'bar-2', routing: 'square', marker: 'arrow' },
      ],
      axisInput: {
        viewId: 'week',
        anchorDate: new Date('2026-01-05'),
        viewportWidth: 900,
        locale: 'en',
        weekendsVisible: true,
      },
    };
  },
};
</script>
```

```tsx [React]
import { ChronixGantt } from '@chronixjs/gantt-react';
import type { BarSpec, RowSpec, LinkSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-12'), end: new Date('2026-01-20') },
    dprIntent: 'crisp-pixel',
  },
];

const links: LinkSpec[] = [
  { id: 'link-1', fromBarId: 'bar-1', toBarId: 'bar-2', routing: 'square', marker: 'arrow' },
];

export function App() {
  return <ChronixGantt bars={bars} rows={rows} axisInput={axisInput} links={links} />;
}
```

:::

## Routing Styles

### Square (default)

Rectangular path with right-angle turns:

```typescript
{ routing: 'square', marker: 'arrow' }
```

### Smooth

Curved Bézier path between bars:

```typescript
{ routing: 'smooth', marker: 'arrow' }
```

## Built-in Markers

Choose from 8 built-in arrow/end markers:

| Marker             | Description               |
| ------------------ | ------------------------- |
| `'arrow'`          | Filled triangle arrowhead |
| `'diamond'`        | Filled diamond            |
| `'diamond-hollow'` | Hollow diamond outline    |
| `'circle'`         | Filled circle             |
| `'circle-hollow'`  | Hollow circle outline     |
| `'pointer'`        | Thin pointer arrow        |
| `'plus'`           | Plus sign                 |
| `'none'`           | No marker                 |

## Custom Markers

Define custom SVG markers for specialized link types:

```typescript
const links: LinkSpec[] = [
  {
    id: 'link-1',
    fromBarId: 'bar-1',
    toBarId: 'bar-2',
    routing: 'smooth',
    marker: {
      id: 'custom-arrow',
      viewBox: '0 0 10 10',
      paths: [{ d: 'M 0 0 L 10 5 L 0 10 z', fill: '#ef4444' }],
    },
  },
];
```

| Field     | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `id`      | `string` | Unique SVG marker ID          |
| `viewBox` | `string` | SVG viewBox attribute         |
| `paths`   | `Path[]` | Array of SVG path definitions |

Each path supports `d`, `fill`, `stroke`, and `strokeWidth`.

## Link Color Override

Set a custom color on individual links:

```typescript
const links: LinkSpec[] = [
  {
    id: 'link-1',
    fromBarId: 'bar-1',
    toBarId: 'bar-2',
    routing: 'square',
    marker: 'arrow',
    colorOverride: '#ef4444', // Red for critical dependency
  },
];
```

## Link Render Callback

Dynamically customize link appearance with `onLineCallback`:

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :links="links"
    :on-line-callback="customLinkRender"
  />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { LinkRenderFunc } from '@chronixjs/gantt';

const customLinkRender: LinkRenderFunc = (arg) => {
  // Color critical path links red
  if (arg.fromBar.id === 'bar-1') {
    return { color: '#ef4444' };
  }
  return undefined; // use default styling
};
</script>
```

```tsx [React]
import { ChronixGantt } from '@chronixjs/gantt-react';
import type { LinkRenderFunc } from '@chronixjs/gantt';

const customLinkRender: LinkRenderFunc = (arg) => {
  if (arg.fromBar.id === 'bar-1') {
    return { color: '#ef4444' };
  }
  return undefined;
};

export function App() {
  return (
    <ChronixGantt
      bars={bars}
      rows={rows}
      axisInput={axisInput}
      links={links}
      onLineCallback={customLinkRender}
    />
  );
}
```

:::

## Orphan Handling

When a link references a bar that doesn't exist, the `link-orphan` event fires:

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :links="links"
    @link-orphan="onOrphan"
  />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';

function onOrphan(linkId: string) {
  console.warn(`Link ${linkId} references a missing bar`);
}
</script>
```

:::

## API Reference

### LinkSpec

| Field           | Type                             | Default   | Description        |
| --------------- | -------------------------------- | --------- | ------------------ |
| `id`            | `string`                         | —         | Unique identifier  |
| `fromBarId`     | `string`                         | —         | Source bar ID      |
| `toBarId`       | `string`                         | —         | Target bar ID      |
| `routing`       | `'square' \| 'smooth'`           | —         | Path routing style |
| `marker`        | `LinkMarker \| CustomLinkMarker` | `'arrow'` | End marker style   |
| `colorOverride` | `string`                         | —         | Per-link color     |

### Events

| Event         | Payload  | Description                            |
| ------------- | -------- | -------------------------------------- |
| `link-orphan` | `string` | Fired when link references missing bar |
