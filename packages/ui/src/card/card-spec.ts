/**
 * Card IR — . Tier A info-container component.
 *
 * Renders a bordered/elevated content surface with an optional title
 * row and optional footer region. 3 sizes drive padding tokens.
 *
 * surface intentionally minimal: only `title` (string prop)
 * + default body slot/children + `footer` flag determining whether the
 * adapter renders the `__footer` element from a `footer` slot/prop.
 * + Tier B Card phase may widen to header-extra + action-row +
 * cover-image slots once consumer requirements crystallize.
 *
 * Public surface:
 *
 * - **`CardSize`** — `'small' | 'medium' | 'large'`.
 * - **`CardProps`** + **`defaultCardProps`**.
 * - **`resolveCardClassList`** pure helper.
 */

/** Sizing token — drives padding tokens. */
export type CardSize = 'small' | 'medium' | 'large';

/**
 * Declarative props consumed by `ChronixCard` adapters.
 */
export interface CardProps {
  /** Sizing token. Default `'medium'`. */
  readonly size: CardSize;
  /**
   * Optional title text. When present, renders an `__header` row above
   * the body content. `undefined` skips the header row entirely.
   */
  readonly title: string | undefined;
  /** Visible border. Default `true`. */
  readonly bordered: boolean;
  /**
   * Hover elevation effect (shadow lifts on hover). Default `false`.
   */
  readonly hoverable: boolean;
  /**
   * "Embedded" variant — flat background that blends with the
   * containing context (no shadow, transparent bg). Useful for cards
   * inside other cards or in colored containers. Default `false`.
   */
  readonly embedded: boolean;
}

/**
 * Sensible defaults.
 */
export const defaultCardProps: CardProps = {
  size: 'medium',
  title: undefined,
  bordered: true,
  hoverable: false,
  embedded: false,
};
