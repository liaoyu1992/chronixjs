/**
 * PageHeader IR — . Tier A page-chrome primitive.
 *
 * Renders the standardized top-of-page heading block: optional
 * back-affordance + avatar slot + title + subtitle + right-aligned
 * extra actions + footer slot + main content slot. Used by route
 * landings, detail screens, wizard steps.
 *
 * Public surface:
 *
 * - **`PageHeaderProps`** + **`defaultPageHeaderProps`** — declarative
 *   props consumed by `ChronixPageHeader` adapters.
 * - **`PAGE_HEADER_BACK_ICON_PLACEHOLDER`** — unicode `'←'` rendered as
 *   the default back-button content. icon registry will
 *   substitute an SVG once geometry helpers mature; this is the Phase
 *   19 stub matching the Empty / Result
 *   icon-placeholder convention.
 *
 * The title / subtitle pair follows Decision B.1: the
 * declarative string prop is the common case; adapters expose a
 * same-name slot (Vue) / same-name ReactNode prop (React) that
 * overrides the string when supplied. Slot precedence wins because
 * slots are strictly more expressive than strings.
 */

export interface PageHeaderProps {
  /** Heading text. `undefined` opts out unless slot supplied. */
  readonly title: string | undefined;
  /** Sub-heading text. `undefined` opts out unless slot supplied. */
  readonly subtitle: string | undefined;
  /**
   * When `true`, renders a clickable `__back-button` affordance on
   * the left of the heading. Default `false`.
   */
  readonly back: boolean;
  /**
   * When `true`, uses dark-surface theme tokens (`--cx-ui-page-header-bg-inverted`
   * etc.). Default `false`. ships only the boolean form;
   * `'auto' | 'light' | 'dark'` 3-state is parked per Decision E.1.
   */
  readonly inverted: boolean;
}

export const defaultPageHeaderProps: PageHeaderProps = {
  title: undefined,
  subtitle: undefined,
  back: false,
  inverted: false,
};

/**
 * Built-in unicode placeholder for the back affordance. icon
 * registry will swap in an SVG when geometry helpers mature.
 *
 * Shared by all 3 adapters so the rendered character is byte-
 * identical across vue3 / vue2 / react and the cross-demo Playwright
 * fingerprint stays stable.
 */
export const PAGE_HEADER_BACK_ICON_PLACEHOLDER = '←';
