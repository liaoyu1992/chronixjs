import { describe, expect, it } from 'vitest';

import { resolveTimelineClassList } from './resolve-timeline-class-list.js';
import { defaultTimelineProps } from './timeline-spec.js';

describe('resolveTimelineClassList', () => {
  it('returns just the base class', () => {
    expect(resolveTimelineClassList(defaultTimelineProps)).toEqual(['cx-ui-timeline']);
  });

  it('returns a fresh array per call', () => {
    const a = resolveTimelineClassList(defaultTimelineProps);
    const b = resolveTimelineClassList(defaultTimelineProps);
    expect(a).not.toBe(b);
  });
});
