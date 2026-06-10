# Theme System

Chronix UI uses a CSS custom properties (variables) based theming system with BEM naming conventions.

## Overview

All UI components use the `cx-ui-` prefix for their CSS classes. Styles are injected automatically via the sticky-flag pattern — no manual CSS imports needed.

## CSS Variable Tokens

The theme is built on CSS custom properties organized by category:

### Colors

```css
:root {
  /* Primary palette */
  --cx-color-primary: #6366f1;
  --cx-color-primary-light: #818cf8;
  --cx-color-primary-dark: #4f46e5;

  /* Semantic colors */
  --cx-color-success: #22c55e;
  --cx-color-warning: #f59e0b;
  --cx-color-danger: #ef4444;
  --cx-color-info: #3b82f6;

  /* Neutral palette */
  --cx-color-text: #1f2937;
  --cx-color-text-secondary: #6b7280;
  --cx-color-bg: #ffffff;
  --cx-color-bg-secondary: #f9fafb;
  --cx-color-border: #e5e7eb;
}
```

### Sizing & Spacing

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

## Customizing the Theme

Override CSS variables at the `:root` level or scope them to specific containers:

```css
/* Global override — affects all components */
:root {
  --cx-color-primary: #8b5cf6; /* Change primary to purple */
  --cx-radius-md: 12px; /* Rounder corners */
}

/* Scoped override — only affects components inside .my-app */
.my-app {
  --cx-color-primary: #ec4899; /* Pink primary for this section */
}
```

## Dark Mode

Toggle dark mode by adding a class to the root element:

```css
html.dark {
  --cx-color-text: #f9fafb;
  --cx-color-text-secondary: #9ca3af;
  --cx-color-bg: #111827;
  --cx-color-bg-secondary: #1f2937;
  --cx-color-border: #374151;
}
```

VitePress's built-in dark mode toggle will automatically apply the `dark` class, so your component docs will support both themes out of the box.

## BEM Naming Convention

All component classes follow BEM:

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

## Component-Level Customization

Each component supports a `class` prop for additional styling:

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

## Next Steps

- [Button](/ui/components/button) — first component documentation
