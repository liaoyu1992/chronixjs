---
"@chronixjs/table": minor
"@chronixjs/table-vue3": minor
"@chronixjs/table-vue2": minor
"@chronixjs/table-react": minor
---

# Fix tool-panel settings button: decouple from actions column + vue2 render loop

## 1. Settings gear icon incorrectly bound to actions column (all adapters)

The settings (gear) icon was rendered whenever a column had `actions`, regardless of whether `toolPanel` was configured. Two bugs resulted:

- **Dead gear icon on tables without `toolPanel`**: clicking did nothing (`toggleSettingsPopover` short-circuits when `toolPanel` is absent).
- **No gear icon when `toolPanel` is configured but no `actions` column exists**: the icon had no header cell to live in.

Fix: the gear icon now renders only when `toolPanel.show` is `true` with a non-empty `panels` array. When `toolPanel` is enabled and the consumer's `columns` contains no `actions` column, the adapter injects a synthetic pinned-right `actions: []` column (`id: __cx_settings__`) so the icon always has a host. The synthetic column is internal - it feeds layout/render only and never leaks into `columns-change` emits, xlsx export, or saved-view serialization.

## 2. Vue 2 infinite update loop when opening the settings popover

Opening the settings popover triggered a Vue 2 "infinite update loop in a component render function" warning (~107 iterations per open) and 1-2s render lag.

Root cause: the settings button, popover, and tab bar used **inline arrow-function ref callbacks** (`ref: (el) => { someRef.value = el }`). Vue 2 re-executes ref callbacks when the function identity changes between renders. Since inline arrows create a new function each render, Vue 2 would unregister (null) then re-register the element on every patch, causing `settingsIconButtonRef` to oscillate `el -> null -> el`. The render function reads `settingsIconButtonRef.value` for popover positioning, so this oscillation re-triggered render -> patch -> ref callback -> render ..., producing the loop.

Fix: the three settings ref callbacks are now stable named functions defined in `setup()` (`setSettingsIconButtonRef`, `setSettingsPopoverRef`, `setSettingsPopoverTabsRef`). Vue 2 sees the same function identity across renders and skips the unregister/re-register cycle. Vue 3 and React are unaffected (their ref implementations do not re-fire on identity change) and were left unchanged.