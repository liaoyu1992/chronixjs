# CX Kit

Headless UI primitives for building custom components. Framework-agnostic core with maximum flexibility.

## Features

- **Virtual List** — high-performance scrolling for large datasets
- **Slider** — customizable range slider with marks and tooltips
- **Input Range** — dual-handle range input
- **Color Picker** — HSV/HEX/RGB color selection
- **Autocomplete** — type-ahead search with async data loading

## Install

```bash
pnpm add @chronixjs/cx-kit@alpha
```

::: tip
CX Kit is framework-agnostic and can be used directly with any framework. No adapter packages needed.
:::

## Components

### Virtual List

Renders only visible items for smooth scrolling with 100k+ items.

```ts
import { createVirtualList } from '@chronixjs/cx-kit';

const vl = createVirtualList({
  itemCount: 100_000,
  itemSize: 40,
  overscan: 5,
});
```

### Slider

A headless slider with full keyboard and touch support.

```ts
import { createSlider } from '@chronixjs/cx-kit';

const slider = createSlider({
  min: 0,
  max: 100,
  step: 1,
  value: 50,
});
```

### Color Picker

HSV-based color picker with conversion utilities.

```ts
import { createColorPicker } from '@chronixjs/cx-kit';

const picker = createColorPicker({
  color: '#6366f1',
  format: 'hex',
});
```

### Autocomplete

Async-ready autocomplete with debounce and cancellation.

```ts
import { createAutocomplete } from '@chronixjs/cx-kit';

const ac = createAutocomplete({
  debounce: 300,
  async search(query: string) {
    const res = await fetch(`/api/search?q=${query}`);
    return res.json();
  },
});
```

## Next Steps

- [Getting Started](/en/cx-kit/getting-started) — detailed setup guide
- [Virtual List](/en/cx-kit/virtual-list) — virtualized list documentation
- [Slider](/en/cx-kit/slider) — slider configuration
- [Color Picker](/en/cx-kit/color-picker) — color picker usage
- [Autocomplete](/en/cx-kit/autocomplete) — autocomplete with async data
