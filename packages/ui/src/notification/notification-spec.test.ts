import { describe, expect, it } from 'vitest';

import type {
  NotificationItem,
  NotificationPlacement,
  NotificationType,
} from './notification-spec.js';

describe('NotificationItem type', () => {
  it('accepts a valid notification item with all fields', () => {
    const item: NotificationItem = {
      id: 'notif-0',
      title: 'Update available',
      description: 'A new version is ready to install.',
      type: 'info',
      duration: 5000,
      closable: true,
    };
    expect(item.id).toBe('notif-0');
    expect(item.title).toBe('Update available');
    expect(item.description).toBe('A new version is ready to install.');
    expect(item.type).toBe('info');
  });

  it('accepts a notification without description', () => {
    const item: NotificationItem = {
      id: 'notif-1',
      title: 'Saved',
      type: 'success',
      duration: 3000,
      closable: false,
    };
    expect(item.description).toBeUndefined();
  });
});

describe('NotificationPlacement type', () => {
  it('accepts all 4 corner placements', () => {
    const placements: NotificationPlacement[] = [
      'top-right',
      'top-left',
      'bottom-right',
      'bottom-left',
    ];
    expect(placements).toHaveLength(4);
  });
});

describe('NotificationType type', () => {
  it('covers all 4 semantic types', () => {
    const types: NotificationType[] = ['info', 'success', 'warning', 'error'];
    expect(types).toHaveLength(4);
  });
});
