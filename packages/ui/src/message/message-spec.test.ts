import { describe, expect, it } from 'vitest';

import type { MessageItem, MessageQueueOptions } from './message-spec.js';

describe('MessageItem type', () => {
  it('accepts a valid message item with all fields', () => {
    const item: MessageItem = {
      id: 'msg-0',
      content: 'Hello',
      type: 'info',
      duration: 3000,
      closable: true,
    };
    expect(item.id).toBe('msg-0');
    expect(item.content).toBe('Hello');
    expect(item.type).toBe('info');
    expect(item.duration).toBe(3000);
    expect(item.closable).toBe(true);
  });

  it('accepts a persistent message (duration=0)', () => {
    const item: MessageItem = {
      id: 'msg-1',
      content: 'Sticky',
      type: 'warning',
      duration: 0,
      closable: false,
    };
    expect(item.duration).toBe(0);
  });
});

describe('MessageQueueOptions type', () => {
  it('accepts empty options (all optional)', () => {
    const opts: MessageQueueOptions = {};
    expect(opts.max).toBeUndefined();
    expect(opts.placement).toBeUndefined();
    expect(opts.duration).toBeUndefined();
  });

  it('accepts fully populated options', () => {
    const opts: MessageQueueOptions = {
      max: 5,
      placement: 'top-right',
      duration: 5000,
    };
    expect(opts.max).toBe(5);
    expect(opts.placement).toBe('top-right');
    expect(opts.duration).toBe(5000);
  });
});
