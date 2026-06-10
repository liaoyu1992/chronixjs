# CX Kit

用于构建自定义组件的无头 UI 原语。框架无关的核心设计，提供最大的灵活性。

## 功能特性

- **虚拟列表** — 针对大数据集的高性能滚动
- **滑块** — 支持标记和提示的可定制范围滑块
- **范围输入** — 双手柄范围输入
- **颜色选择器** — HSV/HEX/RGB 颜色选择
- **自动补全** — 支持异步数据加载的前置搜索

## 安装

```bash
pnpm add @chronixjs/cx-kit@alpha
```

::: tip
CX Kit 是框架无关的，可以直接在任何框架中使用。无需安装适配器包。
:::

## 组件

### 虚拟列表

仅渲染可见项，即使有 10 万+ 条数据也能保持流畅滚动。

```ts
import { createVirtualList } from '@chronixjs/cx-kit';

const vl = createVirtualList({
  itemCount: 100_000,
  itemSize: 40,
  overscan: 5,
});
```

### 滑块

无头滑块，提供完整的键盘和触摸支持。

```ts
import { createSlider } from '@chronixjs/cx-kit';

const slider = createSlider({
  min: 0,
  max: 100,
  step: 1,
  value: 50,
});
```

### 颜色选择器

基于 HSV 的颜色选择器，附带转换工具函数。

```ts
import { createColorPicker } from '@chronixjs/cx-kit';

const picker = createColorPicker({
  color: '#6366f1',
  format: 'hex',
});
```

### 自动补全

支持异步加载的自动补全，内置防抖和取消功能。

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

## 下一步

- [快速开始](/cx-kit/getting-started) — 详细的配置指南
- [虚拟列表](/cx-kit/virtual-list) — 虚拟列表文档
- [滑块](/cx-kit/slider) — 滑块配置
- [颜色选择器](/cx-kit/color-picker) — 颜色选择器用法
- [自动补全](/cx-kit/autocomplete) — 异步数据自动补全
