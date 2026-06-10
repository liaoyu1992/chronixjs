import {
  createDefaultUIContext,
  cssVarsForUITheme,
  mergeUIContext,
  type ChronixUIContext,
  type ChronixUIContextOverrides,
} from '@chronixjs/ui';
import { computed, defineComponent, h, inject, provide, type InjectionKey, type Ref } from 'vue';

/**
 * Injection key for the resolved `ChronixUIContext` in the Vue 3 adapter.
 * Components consume via `useUIContext()`; consumers wanting raw access
 * may inject this key directly.
 *
 * Phase 11 (2026-06-02) per Phase 0.3 Decision A.1.
 */
export const UI_CONTEXT_INJECTION_KEY: InjectionKey<Ref<ChronixUIContext>> =
  Symbol('ChronixUIContext');

/**
 * Vue 3 `<ChronixUIProvider>` — root provider that propagates a
 * `ChronixUIContext` to every descendant. Nested providers compose
 * via `mergeUIContext` so each scope can override pieces of its
 * ancestor's config.
 *
 * The provider also writes the theme tokens as CSS custom properties
 * on its own root `<div>` element via inline `style`, so descendants'
 * static CSS can read tokens via `var(--cx-ui-...)` fallback.
 *
 * Phase 11 (2026-06-02). Props mirror `ChronixUIContextOverrides`
 * (every field optional); when no parent provider exists, defaults
 * from `createDefaultUIContext` apply.
 */
export const ChronixUIProvider = defineComponent({
  name: 'ChronixUIProvider',
  props: {
    theme: { type: Object, default: undefined },
    locale: { type: Object, default: undefined },
    size: { type: String as () => 'small' | 'medium' | 'large', default: undefined },
    clsPrefix: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    portalContainer: {
      type: [String, Function] as unknown as () => string | (() => HTMLElement | null),
      default: undefined,
    },
    rtl: { type: Boolean, default: undefined },
    componentOverrides: { type: Object, default: undefined },
  },
  setup(props, { slots }) {
    const parentContext = inject<Ref<ChronixUIContext> | null>(UI_CONTEXT_INJECTION_KEY, null);

    const mergedContext = computed<ChronixUIContext>(() => {
      const base = parentContext ? parentContext.value : createDefaultUIContext();
      const overrides = buildOverrides(props);
      return mergeUIContext(base, overrides);
    });

    provide(UI_CONTEXT_INJECTION_KEY, mergedContext);

    const rootStyle = computed(() => cssVarsForUITheme(mergedContext.value.theme));
    const rootAttrs = computed(() => ({
      class: 'cx-ui-provider',
      dir: mergedContext.value.rtl ? 'rtl' : undefined,
      style: rootStyle.value,
    }));

    return () => {
      const defaultSlot = slots['default'];
      return h('div', rootAttrs.value, defaultSlot ? defaultSlot() : []);
    };
  },
});

/**
 * Loose prop shape accepted by `buildOverrides` — every field may be
 * `undefined` per Vue's `ExtractPropTypes` semantics for props with
 * `default: undefined` (Vue widens optional-with-default-undefined to
 * `T | undefined`, conflicting with our `exactOptionalPropertyTypes`).
 */
interface BuildOverridesInput {
  theme: unknown;
  locale: unknown;
  size: 'small' | 'medium' | 'large' | undefined;
  clsPrefix: string | undefined;
  disabled: boolean | undefined;
  portalContainer: string | (() => HTMLElement | null) | undefined;
  rtl: boolean | undefined;
  componentOverrides: unknown;
}

/**
 * Compose a `ChronixUIContextOverrides` from the provider's prop bag,
 * dropping `undefined` entries (so `mergeUIContext`'s "shallow ??"
 * semantics preserve parent values for omitted props).
 */
function buildOverrides(props: BuildOverridesInput): ChronixUIContextOverrides {
  const out: Record<string, unknown> = {};
  if (props.theme !== undefined) out['theme'] = props.theme;
  if (props.locale !== undefined) out['locale'] = props.locale;
  if (props.size !== undefined) out['size'] = props.size;
  if (props.clsPrefix !== undefined) out['clsPrefix'] = props.clsPrefix;
  if (props.disabled !== undefined) out['disabled'] = props.disabled;
  if (props.portalContainer !== undefined) out['portalContainer'] = props.portalContainer;
  if (props.rtl !== undefined) out['rtl'] = props.rtl;
  if (props.componentOverrides !== undefined) out['componentOverrides'] = props.componentOverrides;
  return out;
}
