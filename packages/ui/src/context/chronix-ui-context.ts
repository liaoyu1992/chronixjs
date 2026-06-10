import type { ChronixLocale } from '../locale/chronix-locale.js';
import type { ChronixUITheme, ChronixUIThemeOverrides } from '../theme/chronix-ui-theme.js';

/**
 * Application-wide configuration propagated from `<ChronixUIProvider>`
 * to every descendant component. Pure-data interface — no framework
 * dependencies; adapters wrap this with their native context primitive
 * (Vue 3 `provide`/`inject`, React `Context`, Vue 2 `provide`/`inject`).
 *
 * Phase 2 (2026-06-01) per Phase 0.3 Decision A.1 / B.1 / C.1.
 *
 * Field semantics:
 *
 * - **`theme`** — current `ChronixUITheme`. Adapters convert via
 *   `cssVarsForUITheme` and inline as `style="--cx-ui-*: ..."` on the
 *   provider root element.
 * - **`locale`** — current `ChronixLocale`. Phase 2 ships a minimal
 *   `{ name }` stub; Phase 3 extends with per-component message bundles.
 * - **`size`** — global default component size. Individual components
 *   may override via their own `size` prop; the context value is the
 *   fallback.
 * - **`clsPrefix`** — CSS class prefix. **DECLARED BUT NOT ACTIVE IN
 *   v0.1.0** per Phase 0.3 Decision C.1: chronix-ui's static CSS uses
 *   hardcoded `cx-ui-*` classes; runtime rewriting is deferred to a
 *   future major. The field is carried for API stability — consumers
 *   can pass it; it just has no current effect on rendered class names.
 * - **`disabled`** — global disabled-state propagation. When the
 *   nearest provider's `disabled` is `true`, every descendant component
 *   that supports a `disabled` prop behaves as if disabled, unless it
 *   explicitly sets its own `disabled={false}` (per Phase 0.3 Decision
 *   A.1 default-merge precedence: own-prop wins; falls back to context;
 *   falls back to interface default).
 * - **`portalContainer`** — where adapters mount popovers / dialogs /
 *   tooltips / drawers / etc. via portals. Either a CSS selector string
 *   (e.g. `'body'`) or a function returning the live HTMLElement. The
 *   function form is preferred when the target is created lazily or
 *   ownership changes during the app's lifetime; the string form is
 *   simpler and resolves via `document.querySelector` at popup-mount
 *   time.
 * - **`rtl`** — right-to-left mode. Adapters set `dir="rtl"` on the
 *   provider root. Components that need explicit RTL layout (e.g.
 *   pagination's chevron direction, slider knob direction) read this
 *   field via `useUIContext()`.
 * - **`componentOverrides`** — per-component default-prop bags. Each
 *   key matches a component name (e.g. `'button'`, `'tree'`); the value
 *   is a partial of that component's prop type. Components consult their
 *   own slice via `ctx.componentOverrides[componentName]` at render time
 *   and apply each key as the default for the matching prop. Phase 2
 *   declares the field; per-component reads are wired in each
 *   component's phase.
 */
export interface ChronixUIContext {
  readonly theme: ChronixUITheme;
  readonly locale: ChronixLocale;
  readonly size: 'small' | 'medium' | 'large';
  readonly clsPrefix: string;
  readonly disabled: boolean;
  readonly portalContainer: string | (() => HTMLElement | null);
  readonly rtl: boolean;
  readonly componentOverrides: ChronixUIComponentOverrides;
}

/**
 * Per-component default-prop bag. Keyed by component name (the lowercase
 * form, e.g. `'button'`, `'tree-select'`); each value is a partial of
 * that component's prop type, treated as the default before the consumer's
 * own per-instance props.
 *
 * Typed as `Record<string, Record<string, unknown>>` in Phase 2 for
 * minimal coupling. A future enhancement could link each key to the
 * matching component's prop type via mapped types; that's tracked
 * out-of-scope in [`audit/UI_PHASE_0_3_CONFIG_CONTEXT_DESIGN.md`](../../../../audit/UI_PHASE_0_3_CONFIG_CONTEXT_DESIGN.md).
 */
export type ChronixUIComponentOverrides = Partial<Record<string, Record<string, unknown>>>;

/**
 * Partial overlay applied on top of a `ChronixUIContext` via
 * `mergeUIContext`. Every field is optional; the merge function treats
 * missing fields as "preserve parent" and supplied fields as overrides.
 *
 * For `theme`, the overlay is a `ChronixUIThemeOverrides` so consumers
 * can selectively override theme slices without re-supplying the whole
 * theme object — `mergeUIContext` delegates to `mergeChronixUITheme`
 * for the theme field.
 */
export interface ChronixUIContextOverrides {
  readonly theme?: ChronixUITheme | ChronixUIThemeOverrides;
  readonly locale?: ChronixLocale;
  readonly size?: 'small' | 'medium' | 'large';
  readonly clsPrefix?: string;
  readonly disabled?: boolean;
  readonly portalContainer?: string | (() => HTMLElement | null);
  readonly rtl?: boolean;
  readonly componentOverrides?: ChronixUIComponentOverrides;
}
