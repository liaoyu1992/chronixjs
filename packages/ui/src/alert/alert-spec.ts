/**
 * Alert IR — . Tier A info-container component.
 *
 * Renders a typed banner with an optional title, content slot/children,
 * and an optional close button. 5 semantic types share the same DOM
 * shape and differ only in bg + border + text + icon color tokens.
 *
 * Public surface:
 *
 * - **`AlertType`** — `'default' | 'info' | 'success' | 'warning' |
 *   'error'`.
 * - **`AlertProps`** + **`defaultAlertProps`**.
 * - **`resolveAlertClassList`** pure helper — class set on the
 *   `cx-ui-alert` root.
 *
 * Title is a `string | undefined` prop rather than a slot to keep
 * the surface mirror-able across the 3 adapters trivially. A future
 * phase can widen to slot/children if a consumer needs JSX titles.
 */

/** Semantic type — drives bg + border + text color tokens. */
export type AlertType = 'default' | 'info' | 'success' | 'warning' | 'error';

/**
 * Declarative props consumed by `ChronixAlert` adapters.
 */
export interface AlertProps {
  /** Semantic type. Default `'default'`. */
  readonly type: AlertType;
  /**
   * Optional title text. When present, renders an `__title` row above
   * the body content. `undefined` skips the title row entirely.
   */
  readonly title: string | undefined;
  /** When `true`, a small `×` close button renders in the top-right. */
  readonly closable: boolean;
  /**
   * When `true`, the alert is rendered with a visible 1px border in
   * the matching type color. Default `true`.
   */
  readonly bordered: boolean;
}

/**
 * Sensible defaults for `AlertProps`.
 */
export const defaultAlertProps: AlertProps = {
  type: 'default',
  title: undefined,
  closable: false,
  bordered: true,
};
