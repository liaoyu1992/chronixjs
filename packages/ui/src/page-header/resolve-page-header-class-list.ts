import type { PageHeaderProps } from './page-header-spec.js';

/**
 * Adapter-supplied booleans describing which optional slots /
 * children resolved to content. The class list is driven by both
 * the declarative props AND the resolved slot state so the BEM
 * `--with-*` modifiers are stable across the 3 adapters.
 */
export interface PageHeaderClassListInput {
  readonly props: PageHeaderProps;
  /** Title prop OR title slot resolved to non-empty content. */
  readonly hasTitle: boolean;
  /** Subtitle prop OR subtitle slot resolved to non-empty content. */
  readonly hasSubtitle: boolean;
  /** Avatar slot / React node prop resolved to content. */
  readonly hasAvatar: boolean;
  /** Extra slot / React node prop resolved to content. */
  readonly hasExtra: boolean;
  /** Footer slot / React node prop resolved to content. */
  readonly hasFooter: boolean;
  /** Default slot / React children resolved to content. */
  readonly hasContent: boolean;
}

/**
 * Compute class set for the PageHeader root element.
 *
 * .
 *
 * Class structure:
 *
 * - `'cx-ui-page-header'` — always present.
 * - `'cx-ui-page-header--inverted'` — present iff `props.inverted`.
 * - `'cx-ui-page-header--with-back'` — present iff `props.back`.
 * - `'cx-ui-page-header--with-avatar'` — present iff `hasAvatar`.
 * - `'cx-ui-page-header--with-title'` — present iff `hasTitle`.
 * - `'cx-ui-page-header--with-subtitle'` — present iff `hasSubtitle`.
 * - `'cx-ui-page-header--with-extra'` — present iff `hasExtra`.
 * - `'cx-ui-page-header--with-footer'` — present iff `hasFooter`.
 * - `'cx-ui-page-header--with-content'` — present iff `hasContent`.
 */
export function resolvePageHeaderClassList(input: PageHeaderClassListInput): string[] {
  const { props, hasTitle, hasSubtitle, hasAvatar, hasExtra, hasFooter, hasContent } = input;
  const classes = ['cx-ui-page-header'];
  if (props.inverted) classes.push('cx-ui-page-header--inverted');
  if (props.back) classes.push('cx-ui-page-header--with-back');
  if (hasAvatar) classes.push('cx-ui-page-header--with-avatar');
  if (hasTitle) classes.push('cx-ui-page-header--with-title');
  if (hasSubtitle) classes.push('cx-ui-page-header--with-subtitle');
  if (hasExtra) classes.push('cx-ui-page-header--with-extra');
  if (hasFooter) classes.push('cx-ui-page-header--with-footer');
  if (hasContent) classes.push('cx-ui-page-header--with-content');
  return classes;
}
