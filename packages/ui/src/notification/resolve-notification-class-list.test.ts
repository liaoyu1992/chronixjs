import { describe, expect, it } from 'vitest';

import { resolveNotificationClassList } from './resolve-notification-class-list.js';

import type { NotificationType } from './notification-spec.js';

describe('resolveNotificationClassList', () => {
  it('returns base + info type for info', () => {
    expect(resolveNotificationClassList({ type: 'info' })).toEqual([
      'cx-ui-notification',
      'cx-ui-notification--info',
    ]);
  });

  it('reflects all 4 types', () => {
    const types: NotificationType[] = ['info', 'success', 'warning', 'error'];
    for (const t of types) {
      const classes = resolveNotificationClassList({ type: t });
      expect(classes).toContain('cx-ui-notification');
      expect(classes).toContain(`cx-ui-notification--${t}`);
    }
  });

  it('always returns exactly 2 classes', () => {
    const types: NotificationType[] = ['info', 'success', 'warning', 'error'];
    for (const t of types) {
      expect(resolveNotificationClassList({ type: t })).toHaveLength(2);
    }
  });
});
