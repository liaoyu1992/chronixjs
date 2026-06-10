# 主题系统

Chronix UI 使用基于 CSS 自定义属性（变量）的主题系统，并采用 BEM 命名规范。

## 概览

所有 UI 组件的 CSS 类均使用 `cx-ui-` 前缀。样式通过粘性标记模式自动注入——无需手动导入 CSS。

## CSS 变量令牌

主题建立在按类别组织的 CSS 自定义属性之上：

### 颜色

```css
:root {
  /* 主色调 */
  --cx-color-primary: #6366f1;
  --cx-color-primary-light: #818cf8;
  --cx-color-primary-dark: #4f46e5;

  /* 语义色 */
  --cx-color-success: #22c55e;
  --cx-color-warning: #f59e0b;
  --cx-color-danger: #ef4444;
  --cx-color-info: #3b82f6;

  /* 中性色 */
  --cx-color-text: #1f2937;
  --cx-color-text-secondary: #6b7280;
  --cx-color-bg: #ffffff;
  --cx-color-bg-secondary: #f9fafb;
  --cx-color-border: #e5e7eb;
}
```

### 尺寸与间距

```css
:root {
  --cx-radius-sm: 4px;
  --cx-radius-md: 6px;
  --cx-radius-lg: 8px;
  --cx-radius-full: 9999px;

  --cx-spacing-xs: 4px;
  --cx-spacing-sm: 8px;
  --cx-spacing-md: 12px;
  --cx-spacing-lg: 16px;
  --cx-spacing-xl: 24px;

  --cx-font-size-sm: 12px;
  --cx-font-size-md: 14px;
  --cx-font-size-lg: 16px;
}
```

## 自定义主题

在 `:root` 层级覆盖 CSS 变量，或将变量限定在特定容器内：

```css
/* 全局覆盖 — 影响所有组件 */
:root {
  --cx-color-primary: #8b5cf6; /* 将主色改为紫色 */
  --cx-radius-md: 12px; /* 更圆的圆角 */
}

/* 局部覆盖 — 仅影响 .my-app 内的组件 */
.my-app {
  --cx-color-primary: #ec4899; /* 该区域使用粉色主色 */
}
```

## 暗黑模式

通过在根元素添加 class 来切换暗黑模式：

```css
html.dark {
  --cx-color-text: #f9fafb;
  --cx-color-text-secondary: #9ca3af;
  --cx-color-bg: #111827;
  --cx-color-bg-secondary: #1f2937;
  --cx-color-border: #374151;
}
```

VitePress 内置的暗黑模式切换会自动应用 `dark` 类，因此你的组件文档将同时支持两种主题。

## BEM 命名规范

所有组件类名遵循 BEM 规范：

```css
.cx-ui-button {
} /* Block */
.cx-ui-button--primary {
} /* Modifier */
.cx-ui-button__icon {
} /* Element */
.cx-ui-button__icon--left {
} /* Element modifier */
```

## 组件级自定义

每个组件支持 `class` 属性，用于添加额外样式：

::: code-group

```vue [Vue 3]
<template>
  <CxButton class="my-custom-button">Click Me</CxButton>
</template>

<style scoped>
.my-custom-button {
  --cx-color-primary: #ec4899;
}
</style>
```

```vue [Vue 2]
<template>
  <CxButton class="my-custom-button">Click Me</CxButton>
</template>

<style scoped>
.my-custom-button {
  --cx-color-primary: #ec4899;
}
</style>
```

```tsx [React]
import { CxButton } from '@chronixjs/ui-react';
import './custom-button.css';

export function App() {
  return <CxButton className="my-custom-button">Click Me</CxButton>;
}
```

```css
/* custom-button.css */
.my-custom-button {
  --cx-color-primary: #ec4899;
}
```

:::

## 下一步

- [Button](/ui/components/button) — 第一个组件文档
