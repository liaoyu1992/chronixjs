# @chronixjs/ui-vue3

Vue 3 adapter for [`@chronixjs/ui`](../../packages/ui/) — 85 Vue 3 components wrapping the framework-agnostic UI IR.

## Install

```bash
pnpm add @chronixjs/ui-vue3 @chronixjs/ui vue
```

`vue` is a peer dependency (`^3.5.0`); `@chronixjs/ui` is a regular dependency.

## Quick start

```vue
<script setup lang="ts">
import { ChronixUIProvider, ChronixButton, ChronixInput, ChronixTabs } from '@chronixjs/ui-vue3';
import { ref } from 'vue';

const activeTab = ref('tab1');
const tabs = [
  { key: 'tab1', label: 'Tab 1', content: 'Content 1', disabled: false },
  { key: 'tab2', label: 'Tab 2', content: 'Content 2', disabled: false },
];
</script>

<template>
  <ChronixUIProvider>
    <ChronixButton variant="primary">Click me</ChronixButton>
    <ChronixInput placeholder="Type here..." />
    <ChronixTabs v-model:value="activeTab" :items="tabs" />
  </ChronixUIProvider>
</template>
```

## Component catalog (85 components)

| Family     | Components                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| Button     | Button, ButtonGroup                                                                                  |
| Input      | Input, InputOtp, AutoComplete, InputNumber, Textarea                                                 |
| Select     | Select, TreeSelect, Cascader, Mention                                                                |
| Toggle     | Checkbox, Switch, Radio, RadioGroup, Rate                                                            |
| Display    | Tag, Badge, Avatar, AvatarGroup, Typography, Code, GradientText, Highlight                           |
| Layout     | Layout, LayoutHeader, LayoutSider, LayoutContent, LayoutFooter, Space, Flex, Grid, Split             |
| Navigation | Tabs, Breadcrumb, PageHeader, Anchor, Menu, Dropdown                                                 |
| Feedback   | Modal, Drawer, Popover, Tooltip, Popconfirm, PopSelect, Alert                                        |
| Data       | Tree, Descriptions, List, Statistic, Timeline, Steps, Log, Thing, Skeleton                           |
| Form       | Form, FormItem, DatePicker, TimePicker, Calendar, ColorPicker, Slider, Transfer, Upload              |
| Loading    | Spin, Progress, LoadingBar                                                                           |
| Visual     | Watermark, QrCode, Marquee, Image, Icon, IconWrapper                                                 |
| Motion     | Collapse, CollapseTransition, Carousel, Wave, NumberAnimation, Countdown, Result                     |
| Misc       | FloatButton, FloatButtonGroup, Affix, BackTop, FocusDetector, Ellipsis, Equation, Heatmap, Scrollbar |
| Dynamic    | DynamicInput, DynamicTags, InfiniteScroll                                                            |
| Imperative | Message, Notification, DiscreteDialog                                                                |

## Theme customization

```vue
<script setup lang="ts">
import { ChronixUIProvider } from '@chronixjs/ui-vue3';
import { mergeChronixUITheme, defaultChronixUITheme } from '@chronixjs/ui';

const theme = mergeChronixUITheme(defaultChronixUITheme, {
  Button: { borderRadius: '8px' },
});
</script>

<template>
  <ChronixUIProvider :theme="theme">
    <slot />
  </ChronixUIProvider>
</template>
```

## Status

v0.1.0-alpha. APIs may shift before `1.0.0`. SemVer stability commitment begins at `1.0`.

## License

MIT
