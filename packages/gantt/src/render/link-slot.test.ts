import { describe, expect, it } from 'vitest';

import { createSlotRegistry } from './create-slot-registry.js';
import { LINK_SLOT_NAME, type LinkSlotArgs } from './link-slot.js';

import { defaultChronixTheme } from '../api/chronix-theme.js';

import type { LinkSpec } from '../ir/index.js';
import type { PlacedBar, RoutedLink } from '../layout/types.js';
import type { SlotTemplate } from './slot.js';

const fromBar: PlacedBar = {
  barId: 'a',
  x: 0,
  y: 0,
  width: 200,
  height: 30,
  isStart: true,
  isEnd: true,
};
const toBar: PlacedBar = {
  barId: 'b',
  x: 400,
  y: 50,
  width: 200,
  height: 30,
  isStart: true,
  isEnd: true,
};
const linkSpec: LinkSpec = {
  id: 'link-1',
  fromBarId: 'a',
  toBarId: 'b',
  routing: 'square',
  marker: 'arrow',
};
const routedLink: RoutedLink = {
  linkId: 'link-1',
  pathD: 'M 200 15 L 400 65',
  marker: { x: 400, y: 65, angleDeg: 0 },
};

describe('LINK_SLOT_NAME + LinkSlotArgs — Phase 28.3', () => {
  it('exports LINK_SLOT_NAME as the literal "link" constant', () => {
    expect(LINK_SLOT_NAME).toBe('link');
  });

  it('LinkSlotArgs type-checks the required fields', () => {
    const args: LinkSlotArgs = {
      routedLink,
      linkSpec,
      fromBar,
      toBar,
      color: '#3788d8',
      marker: 'arrow',
      theme: defaultChronixTheme,
    };
    expect(args.routedLink.linkId).toBe('link-1');
    expect(args.linkSpec.fromBarId).toBe('a');
    expect(args.fromBar.barId).toBe('a');
    expect(args.toBar.barId).toBe('b');
    expect(args.color).toBe('#3788d8');
    expect(args.marker).toBe('arrow');
    // Theme bound; consumer can read any token (e.g. link stroke width).
    expect(typeof args.theme.linkStrokeWidth).toBe('number');
  });

  it('slotRegistry.register(LINK_SLOT_NAME, ...) round-trips like the bar slot', () => {
    const registry = createSlotRegistry();
    expect(registry.get(LINK_SLOT_NAME)).toBeUndefined();

    // Sentinel return so the test doesn't depend on a framework's
    // VNode type. The slot system stores templates opaquely; reading
    // back identity-equality is all this layer guarantees.
    const sentinel = { type: 'sentinel-vnode' };
    const template: SlotTemplate = () => sentinel;
    registry.register(LINK_SLOT_NAME, template);
    const back = registry.get(LINK_SLOT_NAME);
    expect(back).toBe(template);

    registry.unregister(LINK_SLOT_NAME);
    expect(registry.get(LINK_SLOT_NAME)).toBeUndefined();
  });
});
