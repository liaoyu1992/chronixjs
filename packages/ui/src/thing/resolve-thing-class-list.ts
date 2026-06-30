import type { ThingProps } from './thing-spec.js';

/**
 * Adapter-supplied booleans describing which optional slots /
 * children resolved to content. The class list is driven by both
 * the declarative props AND the resolved slot state so the BEM
 * `--with-*` modifiers are stable across the 3 adapters.
 *
 * Mirrors PageHeader's `PageHeaderClassListInput`
 * convention.
 */
export interface ThingClassListInput {
  readonly props: ThingProps;
  /** Avatar slot / React node prop resolved to content. */
  readonly hasAvatar: boolean;
  /** `props.title` set OR header slot resolved to content. */
  readonly hasHeader: boolean;
  /** Header-extra slot / React node prop resolved to content. */
  readonly hasHeaderExtra: boolean;
  /** `props.description` set OR description slot resolved to content. */
  readonly hasDescription: boolean;
  /** Default slot / React children resolved to content. */
  readonly hasContent: boolean;
  /** Action slot / React node prop resolved to content. */
  readonly hasAction: boolean;
  /** Footer slot / React node prop resolved to content. */
  readonly hasFooter: boolean;
}

/**
 * Compute class set for the Thing root element.
 *
 * .
 *
 * Class structure:
 *
 * - `'cx-ui-thing'` — always present.
 * - `'cx-ui-thing--with-avatar'` — present iff `hasAvatar`.
 * - `'cx-ui-thing--with-header'` — present iff `hasHeader`.
 * - `'cx-ui-thing--with-header-extra'` — present iff `hasHeaderExtra`.
 * - `'cx-ui-thing--with-description'` — present iff `hasDescription`.
 * - `'cx-ui-thing--with-content'` — present iff `hasContent`.
 * - `'cx-ui-thing--with-action'` — present iff `hasAction`.
 * - `'cx-ui-thing--with-footer'` — present iff `hasFooter`.
 * - `'cx-ui-thing--content-indented'` — present iff
 *   `props.contentIndented`.
 */
export function resolveThingClassList(input: ThingClassListInput): string[] {
  const {
    props,
    hasAvatar,
    hasHeader,
    hasHeaderExtra,
    hasDescription,
    hasContent,
    hasAction,
    hasFooter,
  } = input;
  const classes = ['cx-ui-thing'];
  if (hasAvatar) classes.push('cx-ui-thing--with-avatar');
  if (hasHeader) classes.push('cx-ui-thing--with-header');
  if (hasHeaderExtra) classes.push('cx-ui-thing--with-header-extra');
  if (hasDescription) classes.push('cx-ui-thing--with-description');
  if (hasContent) classes.push('cx-ui-thing--with-content');
  if (hasAction) classes.push('cx-ui-thing--with-action');
  if (hasFooter) classes.push('cx-ui-thing--with-footer');
  if (props.contentIndented) classes.push('cx-ui-thing--content-indented');
  return classes;
}
