/**
 * Empty IR — Phase 15 (2026-06-02). Tier A trivial-visual primitive.
 *
 * Renders a centered "nothing here" placeholder: optional icon area,
 * a `description` line, and optional default slot for action buttons
 * below.
 *
 * Phase 15 intentionally keeps the surface minimal — the reference
 * library's `image` slot for custom icons is out of scope; chronix
 * defaults to a built-in chevron-empty icon (TBD Phase 9 icon
 * registry; placeholder text "📦" used in v0.1.0). Trigger to add
 * custom-icon slot: real consumer ask.
 *
 * Public surface:
 *
 * - **`EmptySize`** — `'small' | 'medium' | 'large'`. Drives icon size
 *   + spacing.
 * - **`EmptyProps`** + **`defaultEmptyProps`**.
 * - **`resolveEmptyClassList`** pure helper.
 */

/** Sizing token. */
export type EmptySize = 'small' | 'medium' | 'large';

/**
 * Declarative props consumed by `ChronixEmpty` adapters.
 */
export interface EmptyProps {
  /** Sizing token. Default `'medium'`. */
  readonly size: EmptySize;
  /**
   * Optional description text rendered below the icon. `undefined`
   * suppresses the description row entirely.
   */
  readonly description: string | undefined;
}

/**
 * Sensible defaults.
 */
export const defaultEmptyProps: EmptyProps = {
  size: 'medium',
  description: 'No data',
};
