import { describe, expect, it } from 'vitest';

import { resolveMessageClassList } from './resolve-message-class-list.js';

import type { MessageType } from './message-spec.js';

describe('resolveMessageClassList', () => {
  it('returns base + info type for info', () => {
    expect(resolveMessageClassList({ type: 'info' })).toEqual([
      'cx-ui-message',
      'cx-ui-message--info',
    ]);
  });

  it('reflects all 5 types', () => {
    const types: MessageType[] = ['info', 'success', 'warning', 'error', 'loading'];
    for (const t of types) {
      const classes = resolveMessageClassList({ type: t });
      expect(classes).toContain('cx-ui-message');
      expect(classes).toContain(`cx-ui-message--${t}`);
    }
  });

  it('always returns exactly 2 classes', () => {
    const types: MessageType[] = ['info', 'success', 'warning', 'error', 'loading'];
    for (const t of types) {
      expect(resolveMessageClassList({ type: t })).toHaveLength(2);
    }
  });
});
