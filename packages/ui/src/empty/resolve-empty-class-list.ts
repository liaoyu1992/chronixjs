import type { EmptyProps } from './empty-spec.js';

/**
 * Compute class set for the Empty root element.
 *
 * Phase 15 (2026-06-02).
 *
 * `hasExtra` comes from the adapter — represents whether the default
 * slot / children resolved to any action-row content (typically
 * buttons below the description).
 *
 * Class structure:
 *
 * - `'cx-ui-empty'` — always present.
 * - `'cx-ui-empty--{size}'` — drives icon size + spacing tokens.
 * - `'cx-ui-empty--with-description'` — present iff
 *   `props.description !== undefined`.
 * - `'cx-ui-empty--with-extra'` — present iff the adapter resolved
 *   the default slot/children to action content.
 */
export function resolveEmptyClassList(props: EmptyProps, hasExtra: boolean): string[] {
  const classes = ['cx-ui-empty', `cx-ui-empty--${props.size}`];
  if (props.description !== undefined) classes.push('cx-ui-empty--with-description');
  if (hasExtra) classes.push('cx-ui-empty--with-extra');
  return classes;
}
