# @chronixjs/ui

Framework-agnostic UI component IR (Intermediate Representation) for the chronix UI adapter packages. Ships **144 public exports** — pure-data types, pure-function helpers, CSS strings, and BEM class-list resolvers. **No DOM, no framework binding.** Rendering lives in the adapter.

Three adapter packages consume this core:

| Adapter | Package                                           |
| ------- | ------------------------------------------------- |
| Vue 3   | [`@chronixjs/ui-vue3`](../../adapters/ui-vue3/)   |
| Vue 2   | [`@chronixjs/ui-vue2`](../../adapters/ui-vue2/)   |
| React   | [`@chronixjs/ui-react`](../../adapters/ui-react/) |

## v0.1.0-alpha — 85 components across 5 tiers

| Tier                 | Count                     | Description                                         |
| -------------------- | ------------------------- | --------------------------------------------------- |
| A — Pure visual      | 40                        | Button, Tag, Badge, Typography, Avatar, etc.        |
| B — Stateful / popup | 33                        | Modal, Drawer, Dropdown, Menu, Tabs, Carousel, etc. |
| C — Algorithmic      | 12                        | Tree, Select, DatePicker, Form, Upload, etc.        |
| D — Imperative       | 5                         | Message, Notification, DiscreteDialog, LoadingBar   |
| E — Composites       | —                         | Lazy Carousel, Editable Tabs, Multi-source Mention  |
| **Total**            | **~90 distinct surfaces** | Each × 3 adapters                                   |

## Install

```bash
pnpm add @chronixjs/ui
```

> **Note:** You typically install an adapter package, not the core directly.
> The adapter re-exports everything you need.

## Architecture

```
@chronixjs/ui (this package)
├── theme/          — ChronixUITheme, CSS var tokens, dark preset
├── context/        — ChronixUIContext (size, theme, locale, portal)
├── popup/          — placement math, trigger spec, z-index, focus-trap
├── tree/           — flattenTree, findTreeNode, filterTree, mapTree
├── form/           — async-validator wrapper, field state machine
├── transition/     — 6-phase transition spec, builders
├── icon/           — IconRegistry (SVG geometry registration)
├── {component}/    — 85 component slices: spec + class-list + styles + helpers
```

Each component slice ships the same 5-file cookbook:

1. `*-spec.ts` — Props interface + types + pure helpers
2. `resolve-*-class-list.ts` — BEM class resolver
3. `*-styles.ts` — CSS string + sticky-flag `ensureChronix*Styles()`
4. `index.ts` — Public re-exports
5. Tests

## Key IR modules

- **Theme** — `ChronixUITheme` interface + `cssVarsForUITheme` + `mergeChronixUITheme` + light/dark presets
- **Popup** — 12-placement math, trigger spec, `nextPopupZIndex()`, focus-trap, body-scroll-lock
- **Tree** — `flattenTree` / `findTreeNode` / `collectDescendantKeys` / `filterTree` / `mapTree`
- **Form** — `FieldState<T>` transactions + `validateField` / `validateForm` (async-validator peer-dep)
- **Transition** — `TransitionSpec` 6-phase shape + `buildFadeTransitionStyles` / `buildHeightCollapseTransitionStyles` / `buildSlideTransitionStyles`
- **Icon** — `registerIcon` / `getRegisteredIconSvg` (pluggable SVG geometry)

## Optional peer dependencies

| Package            | Used by                            | Required? |
| ------------------ | ---------------------------------- | --------- |
| `async-validator`  | Form validation                    | Optional  |
| `date-fns`         | DatePicker / TimePicker / Calendar | Optional  |
| `qrcode-generator` | QrCode component                   | Optional  |

## Status

v0.1.0-alpha. APIs may shift before `1.0.0`. SemVer stability commitment begins at `1.0`.

## License

MIT
