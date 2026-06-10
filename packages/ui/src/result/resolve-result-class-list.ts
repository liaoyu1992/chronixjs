import type { ResultProps } from './result-spec.js';

/**
 * Compute class set for the Result root element.
 *
 * Phase 18 (2026-06-02).
 *
 * `hasExtra` comes from the adapter — represents whether the default
 * slot / children resolved to any action-row content.
 *
 * Class structure:
 *
 * - `'cx-ui-result'` — always present.
 * - `'cx-ui-result--status-{value}'` — drives icon + title-color
 *   tokens. One of 9 values (4 semantic + 4 HTTP codes + default).
 * - `'cx-ui-result--with-title'` — present iff `props.title !== undefined`.
 * - `'cx-ui-result--with-description'` — present iff
 *   `props.description !== undefined`.
 * - `'cx-ui-result--with-extra'` — present iff the adapter resolved
 *   the default slot / children to action content.
 */
export function resolveResultClassList(props: ResultProps, hasExtra: boolean): string[] {
  const classes = ['cx-ui-result', `cx-ui-result--status-${props.status}`];
  if (props.title !== undefined) classes.push('cx-ui-result--with-title');
  if (props.description !== undefined) classes.push('cx-ui-result--with-description');
  if (hasExtra) classes.push('cx-ui-result--with-extra');
  return classes;
}
