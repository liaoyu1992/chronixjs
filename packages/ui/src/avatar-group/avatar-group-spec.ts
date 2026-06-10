/**
 * AvatarGroup IR — Phase 24 (2026-06-03). Tier A horizontal stack
 * of overlapping avatars with overflow +N indicator.
 */

import type { AvatarShape } from '../avatar/index.js';

export interface AvatarItem {
  readonly key: string;
  readonly src: string | undefined;
  readonly text: string | undefined;
}

export interface AvatarGroupProps {
  readonly items: readonly AvatarItem[];
  /** Show first `max - 1` items + +N overflow when items.length > max. */
  readonly max: number;
  readonly size: number;
  readonly shape: AvatarShape;
}

export const defaultAvatarGroupProps: AvatarGroupProps = {
  items: [],
  max: 5,
  size: 32,
  shape: 'circle',
};

export interface AvatarGroupSplit {
  readonly visible: readonly AvatarItem[];
  readonly hiddenCount: number;
}

/**
 * Split items into the visible head + count of remaining hidden
 * items. When items.length <= max, returns all items as visible
 * with hiddenCount=0. Otherwise returns first (max - 1) items + the
 * overflow count.
 */
export function splitAvatarGroupItems(items: readonly AvatarItem[], max: number): AvatarGroupSplit {
  if (max <= 0) return { visible: [], hiddenCount: items.length };
  if (items.length <= max) return { visible: items, hiddenCount: 0 };
  const headCount = max - 1;
  return {
    visible: items.slice(0, headCount),
    hiddenCount: items.length - headCount,
  };
}
