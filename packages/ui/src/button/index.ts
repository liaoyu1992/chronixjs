/**
 * chronix-ui button module — .
 *
 * Core IR for the Button component. Adapter SFCs in
 * `@chronixjs/ui-vue3` / `ui-vue2` / `ui-react` consume these types +
 * pure helpers to render framework-specific `<button>` elements with
 * identical class structure (parity-by-construction).
 *
 * Public surface:
 *
 * - `ButtonProps` + `defaultButtonProps` — declarative props bag +
 *   sensible defaults.
 * - `ButtonVariant` / `ButtonSize` / `ButtonHtmlType` — narrow string
 *   unions for each prop axis.
 * - `resolveButtonClassList(props)` — props → ordered array of
 *   `cx-ui-button*` BEM class names.
 *
 * Theme tokens for Button live in the `button` slice of `ChronixUITheme`
 * . Adapters apply tokens via CSS-var fallback in static
 * CSS rules.
 */

export type { ButtonHtmlType, ButtonProps, ButtonSize, ButtonVariant } from './button-spec.js';
export { defaultButtonProps } from './button-spec.js';
export { resolveButtonClassList } from './resolve-button-class-list.js';
export { CHRONIX_BUTTON_CSS, ensureChronixButtonStyles } from './button-styles.js';
