# UI Components

A comprehensive UI component library with **85 components** across 3 framework adapters, featuring a theme system, popup system, and BEM-based styling.

## Features

- **85 Components** — Tier A (40), Tier B (33), Tier C (12)
- **3 Framework Adapters** — Vue 3, Vue 2.7, React 18 / 19
- **Theme System** — CSS custom properties with BEM naming (`cx-ui-*` prefix)
- **Popup System** — modal, drawer, popover, tooltip, confirm dialog
- **Framework-Agnostic Core** — pure helpers + types + CSS in `@chronixjs/ui`
- **Sticky-flag Style Injection** — `ensureChronix*Styles()` with dedup

## Install

::: code-group

```bash [Vue 3]
pnpm add @chronixjs/ui-vue3@alpha vue
```

```bash [Vue 2]
pnpm add @chronixjs/ui-vue2@alpha vue@^2.7
```

```bash [React]
pnpm add @chronixjs/ui-react@alpha react react-dom
```

:::

## Component Categories

### Tier A — Core Components (40)

| Category         | Components                                         |
| ---------------- | -------------------------------------------------- |
| **Buttons**      | Button, ButtonGroup                                |
| **Inputs**       | Input, Textarea, InputNumber, InputPassword        |
| **Selection**    | Checkbox, CheckboxGroup, Radio, RadioGroup, Switch |
| **Display**      | Tag, Badge, Avatar, AvatarGroup, Typography        |
| **Navigation**   | Tabs, Breadcrumb, Pagination, Steps                |
| **Feedback**     | Alert, Progress, Spinner, Skeleton, Result         |
| **Data Display** | Tooltip, Popover, Table (light), Collapse          |

### Tier B — Advanced Components (33)

| Category       | Components                                       |
| -------------- | ------------------------------------------------ |
| **Forms**      | Form, FormItem, Select, Cascader, DatePicker     |
| **Data Entry** | Slider, Rate, ColorPicker, Transfer, TimePicker  |
| **Layout**     | Divider, Space, Grid, Layout                     |
| **Overlay**    | Modal, Drawer, Popconfirm, Message, Notification |
| **Navigation** | Menu, Dropdown, Anchor, BackTop                  |

### Tier C — Specialized Components (12)

| Category     | Components                                     |
| ------------ | ---------------------------------------------- |
| **Advanced** | Tree, TreeSelect, Calendar, Upload, Image      |
| **Data**     | Carousel, Descriptions, Empty, Watermark, Spin |

## Next Steps

- [Getting Started](/en/ui/getting-started) — setup and first component
- [Theme System](/en/ui/theme) — customize the look and feel
- [Button](/en/ui/components/button) — component documentation template
