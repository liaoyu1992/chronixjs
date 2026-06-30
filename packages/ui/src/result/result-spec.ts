/**
 * Result IR — . Tier A terminal-state display.
 *
 * Renders a centered `(icon, title, description, actions)` block for
 * wizard completion / error pages / async-success screens.
 *
 * Public surface:
 *
 * - **`ResultStatus`** — closed union covering 4 semantic colors
 *   (`'default' | 'info' | 'success' | 'warning' | 'error'`) PLUS 4
 *   HTTP status codes (`'404' | '403' | '500' | '418'`). Per Phase
 *   18 Decision B.1 the HTTP codes are semantic aliases — they map
 *   to error/warning styling but carry their own CSS modifier so
 *   consumers can theme each separately.
 * - **`ResultProps`** + **`defaultResultProps`**.
 * - **`resolveResultClassList`** pure helper.
 *
 * Theme tokens read via CSS-var fallback in `result-styles.ts`.
 */

/** Visual / semantic status. */
export type ResultStatus =
  | 'default'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | '404'
  | '403'
  | '500'
  | '418';

/**
 * Declarative props consumed by `ChronixResult` adapters. `title` +
 * `description` opt out when `undefined`; the corresponding DOM
 * elements + `--with-*` modifier classes are omitted.
 */
export interface ResultProps {
  /** Status drives icon + color tokens. Default `'info'`. */
  readonly status: ResultStatus;
  /** Heading text. `undefined` omits the title row. */
  readonly title: string | undefined;
  /** Sub-heading text. `undefined` omits the description row. */
  readonly description: string | undefined;
}

/**
 * Sensible defaults.
 */
export const defaultResultProps: ResultProps = {
  status: 'info',
  title: undefined,
  description: undefined,
};

/**
 * Built-in icon characters per status. icon registry will
 * substitute SVGs once geometry helpers mature; this is the
 * stub matching Empty's icon-placeholder convention.
 *
 * Shared by all 3 adapters so the rendered icon character is
 * byte-identical across vue3 / vue2 / react.
 */
export const RESULT_ICON_BY_STATUS: Readonly<Record<ResultStatus, string>> = {
  default: '📋',
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  '404': '🔍',
  '403': '🔒',
  '500': '💥',
  '418': '☕',
};
