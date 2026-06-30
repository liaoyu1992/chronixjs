import { describe, expect, it } from 'vitest';

import type { LinkRenderArg, LinkRenderFunc, LinkRenderOverride } from './link-render.js';

import type { CustomLinkMarker, LinkSpec } from '../ir/index.js';
import type { PlacedBar, RoutedLink } from '../layout/types.js';

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
  pathD: 'M 200 15 L 212 15 L 212 65 L 400 65',
  marker: { x: 400, y: 65, angleDeg: 0 },
};

describe('LinkRenderArg / LinkRenderOverride / LinkRenderFunc', () => {
  it('LinkRenderArg shape carries routedLink + linkSpec + bars + defaults', () => {
    const arg: LinkRenderArg = {
      routedLink,
      linkSpec,
      fromBar,
      toBar,
      defaultColor: '#3788d8',
      currentMarker: 'arrow',
    };
    expect(arg.routedLink.linkId).toBe('link-1');
    expect(arg.linkSpec.id).toBe('link-1');
    expect(arg.fromBar.barId).toBe('a');
    expect(arg.toBar.barId).toBe('b');
    expect(arg.defaultColor).toBe('#3788d8');
    expect(arg.currentMarker).toBe('arrow');
  });

  it('LinkRenderOverride accepts color-only / marker-only / both / empty', () => {
    const colorOnly: LinkRenderOverride = { color: '#ef4444' };
    const markerOnly: LinkRenderOverride = { marker: 'diamond' };
    const both: LinkRenderOverride = { color: '#10b981', marker: 'circle' };
    const empty: LinkRenderOverride = {};
    expect(colorOnly.color).toBe('#ef4444');
    expect(markerOnly.marker).toBe('diamond');
    expect(both.color).toBe('#10b981');
    expect(both.marker).toBe('circle');
    expect(empty.color).toBeUndefined();
    expect(empty.marker).toBeUndefined();
  });

  it('LinkRenderFunc accepts (arg) => override and (arg) => undefined', () => {
    const overrider: LinkRenderFunc = (arg) =>
      arg.linkSpec.id === 'link-1' ? { color: '#ef4444' } : undefined;
    const passthrough: LinkRenderFunc = () => undefined;
    const arg: LinkRenderArg = {
      routedLink,
      linkSpec,
      fromBar,
      toBar,
      defaultColor: '#3788d8',
      currentMarker: 'arrow',
    };
    expect(overrider(arg)).toEqual({ color: '#ef4444' });
    expect(passthrough(arg)).toBeUndefined();
  });

  it('marker override accepts both built-in `LinkMarker` strings and `CustomLinkMarker` objects', () => {
    const customMarker: CustomLinkMarker = {
      id: 'heart',
      viewBox: '0 0 16 16',
      paths: [{ d: 'M 8 14 L 1 7 ...', fill: '#ef4444' }],
    };
    const builtIn: LinkRenderOverride = { marker: 'diamond-hollow' };
    const custom: LinkRenderOverride = { marker: customMarker };
    expect(builtIn.marker).toBe('diamond-hollow');
    expect(typeof custom.marker === 'object' && custom.marker.id === 'heart').toBe(true);
  });

  it('LinkRenderFunc can be assigned without explicit type parameter at the call site', () => {
    // The function signature is the documentation; consumers write
    // arrow functions inline and TypeScript infers from the param
    // position. This compiles iff `LinkRenderFunc` is structurally
    // assignable to that arrow-function shape.
    function withCallback(cb: LinkRenderFunc): LinkRenderFunc {
      return cb;
    }
    const inline = withCallback((arg) => ({ color: arg.defaultColor }));
    expect(typeof inline).toBe('function');
    const result = inline({
      routedLink,
      linkSpec,
      fromBar,
      toBar,
      defaultColor: '#abc',
      currentMarker: 'arrow',
    });
    expect(result).toEqual({ color: '#abc' });
  });
});
