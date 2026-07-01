# UI 组件概览

功能全面的 UI 组件库，提供 **85 个组件**，支持 3 个框架适配器，具备主题系统、弹出层系统和基于 BEM 的样式方案。

## 特性

- **85 个组件** — A 级 (40)、B 级 (33)、C 级 (12)
- **3 个框架适配器** — Vue 3、Vue 2.7、React 18 / 19
- **主题系统** — 基于 CSS 自定义属性，采用 BEM 命名（`cx-ui-*` 前缀）
- **弹出层系统** — modal、drawer、popover、tooltip、confirm dialog
- **框架无关的核心** — `@chronixjs/ui` 中包含纯辅助函数 + 类型 + CSS
- **粘性标记样式注入** — `ensureChronix*Styles()` 自动去重

## 安装

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

## 组件分类

### A 级 — 核心组件 (40)

| 分类         | 组件                                               |
| ------------ | -------------------------------------------------- |
| **按钮**     | Button, ButtonGroup                                |
| **输入框**   | Input, Textarea, InputNumber, InputPassword        |
| **选择**     | Checkbox, CheckboxGroup, Radio, RadioGroup, Switch |
| **展示**     | Tag, Badge, Avatar, AvatarGroup, Typography        |
| **导航**     | Tabs, Breadcrumb, Pagination, Steps                |
| **反馈**     | Alert, Progress, Spinner, Skeleton, Result         |
| **数据展示** | Tooltip, Popover, Table (轻量), Collapse           |

### B 级 — 高级组件 (33)

| 分类         | 组件                                             |
| ------------ | ------------------------------------------------ |
| **表单**     | Form, FormItem, Select, Cascader, DatePicker     |
| **数据录入** | Slider, Rate, ColorPicker, Transfer, TimePicker  |
| **布局**     | Divider, Space, Grid, Layout                     |
| **浮层**     | Modal, Drawer, Popconfirm, Message, Notification |
| **导航**     | Menu, Dropdown, Anchor, BackTop                  |

### C 级 — 专用组件 (12)

| 分类     | 组件                                           |
| -------- | ---------------------------------------------- |
| **高级** | Tree, TreeSelect, Calendar, Upload, Image      |
| **数据** | Carousel, Descriptions, Empty, Watermark, Spin |

## 下一步

- [快速开始](/ui/getting-started) — 安装配置和第一个组件
- [主题系统](/ui/theme) — 自定义外观和风格
- [Button](/ui/components/button) — 组件文档模板
