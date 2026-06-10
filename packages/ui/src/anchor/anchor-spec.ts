/**
 * Anchor IR — Phase 35. Vertical anchor navigation with
 * optional rail and active indicator.
 */

export interface AnchorItem {
  readonly key: string;
  readonly label: string;
  readonly href: string;
}

export interface AnchorProps {
  readonly items: readonly AnchorItem[];
  readonly showRail?: boolean | undefined;
  readonly showBackground?: boolean | undefined;
  readonly bound?: number;
}

export const defaultAnchorProps: AnchorProps = {
  items: [],
  showRail: true,
  showBackground: true,
  bound: 12,
};
