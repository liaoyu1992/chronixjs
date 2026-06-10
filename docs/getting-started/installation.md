# Installation

Chronix is a monorepo of framework-agnostic components with dedicated adapters for **Vue 3**, **Vue 2.7**, and **React 18**.

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (recommended) or npm / yarn

## Packages

| Package                  | Description              |
| ------------------------ | ------------------------ |
| `@chronixjs/gantt`       | Gantt chart core (IR)    |
| `@chronixjs/table`       | Data table core (IR)     |
| `@chronixjs/ui`          | UI components core (IR)  |
| `@chronixjs/cx-kit`      | Headless primitives      |
| `@chronixjs/gantt-vue3`  | Gantt adapter — Vue 3    |
| `@chronixjs/gantt-vue2`  | Gantt adapter — Vue 2.7  |
| `@chronixjs/gantt-react` | Gantt adapter — React 18 |
| `@chronixjs/table-vue3`  | Table adapter — Vue 3    |
| `@chronixjs/table-vue2`  | Table adapter — Vue 2.7  |
| `@chronixjs/table-react` | Table adapter — React 18 |
| `@chronixjs/ui-vue3`     | UI adapter — Vue 3       |
| `@chronixjs/ui-vue2`     | UI adapter — Vue 2.7     |
| `@chronixjs/ui-react`    | UI adapter — React 18    |

## Install for Your Framework

::: code-group

```bash [Vue 3]
pnpm add @chronixjs/ui-vue3@alpha vue
```

```bash [Vue 2]
pnpm add @chronixjs/ui-vue2@alpha vue@^2.7
```

```bash [React]
pnpm add @chronixjs/ui-react@alpha react@^18 react-dom@^18
```

:::

## Verify Installation

After installing, you can verify the package is correctly installed:

::: code-group

```ts [Vue 3]
import { CxButton } from '@chronixjs/ui-vue3';
console.log(CxButton); // should log the component
```

```ts [Vue 2]
import { CxButton } from '@chronixjs/ui-vue2';
console.log(CxButton); // should log the component
```

```ts [React]
import { CxButton } from '@chronixjs/ui-react';
console.log(CxButton); // should log the component
```

:::

## Next Steps

- [Quick Start](/getting-started/quick-start) — build your first Chronix app
- [Gantt](/gantt/) — explore the Gantt chart component
- [Table](/table/) — explore the data table component
- [UI Components](/ui/) — browse all 85 UI components
