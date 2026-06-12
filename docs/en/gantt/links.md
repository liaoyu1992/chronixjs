<script setup>
import GanttLinksBasic from '../../gantt/demos/GanttLinksBasic.vue';
import ganttLinksBasicCode from '../../gantt/demos/GanttLinksBasic.vue?raw';
import ganttLinksBasicVue2 from '../../gantt/demos/GanttLinksBasic.vue2?raw';
import ganttLinksBasicReact from '../../gantt/demos/GanttLinksBasic.react?raw';
</script>

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

<DemoBox title="Dependency Links" description="Square and smooth routing with arrow markers and custom color override." :code="ganttLinksBasicCode" :code-vue2="ganttLinksBasicVue2" :code-react="ganttLinksBasicReact">
  <GanttLinksBasic />
</DemoBox>

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
