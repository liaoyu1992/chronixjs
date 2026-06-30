import { describe, expect, it } from 'vitest';

import { useDiscreteDialog } from './use-discrete-dialog.js';
import { useLoadingBar } from './use-loading-bar.js';
import { useMessage } from './use-message.js';
import { useNotification } from './use-notification.js';

/**
 * — Vue 3 imperative API composable tests.
 * 2 tests per API: (1) factory returns expected methods, (2) stylesheet injection.
 */

describe('useMessage', () => {
  it('returns API object with expected methods', () => {
    const api = useMessage();
    expect(typeof api.create).toBe('function');
    expect(typeof api.info).toBe('function');
    expect(typeof api.success).toBe('function');
    expect(typeof api.warning).toBe('function');
    expect(typeof api.error).toBe('function');
    expect(typeof api.destroyAll).toBe('function');
    expect(Array.isArray(api.items.value)).toBe(true);
  });

  it('injects the message stylesheet into document.head', () => {
    useMessage();
    const style = document.head.querySelector('style[data-chronix-ui="message"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-message');
  });
});

describe('useNotification', () => {
  it('returns API object with expected methods', () => {
    const api = useNotification();
    expect(typeof api.create).toBe('function');
    expect(typeof api.info).toBe('function');
    expect(typeof api.success).toBe('function');
    expect(typeof api.warning).toBe('function');
    expect(typeof api.error).toBe('function');
    expect(typeof api.destroyAll).toBe('function');
    expect(Array.isArray(api.items.value)).toBe(true);
  });

  it('injects the notification stylesheet into document.head', () => {
    useNotification();
    const style = document.head.querySelector('style[data-chronix-ui="notification"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-notification');
  });
});

describe('useDiscreteDialog', () => {
  it('returns API object with expected methods', () => {
    const api = useDiscreteDialog();
    expect(typeof api.create).toBe('function');
    expect(typeof api.info).toBe('function');
    expect(typeof api.success).toBe('function');
    expect(typeof api.warning).toBe('function');
    expect(typeof api.error).toBe('function');
    expect(typeof api.destroy).toBe('function');
    expect(typeof api.destroyAll).toBe('function');
    expect(Array.isArray(api.items.value)).toBe(true);
  });

  it('injects the discrete-dialog stylesheet into document.head', () => {
    useDiscreteDialog();
    const style = document.head.querySelector('style[data-chronix-ui="discrete-dialog"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-dialog');
  });
});

describe('useLoadingBar', () => {
  it('returns API object with expected methods', () => {
    const api = useLoadingBar();
    expect(typeof api.start).toBe('function');
    expect(typeof api.finish).toBe('function');
    expect(typeof api.error).toBe('function');
    expect(api.state.value).toBe('idle');
    expect(Array.isArray(api.classList.value)).toBe(true);
  });

  it('injects the loading-bar stylesheet into document.head', () => {
    useLoadingBar();
    const style = document.head.querySelector('style[data-chronix-ui="loading-bar"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-loading-bar');
  });
});
