import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDiscreteDialog } from './use-discrete-dialog.js';
import { useLoadingBar } from './use-loading-bar.js';
import { useMessage } from './use-message.js';
import { useNotification } from './use-notification.js';

/**
 * — React imperative API hook tests.
 * 2 tests per API: (1) factory returns expected methods, (2) stylesheet injection.
 */

describe('useMessage', () => {
  it('returns API object with expected methods', () => {
    const { result } = renderHook(() => useMessage());
    const api = result.current;
    expect(typeof api.create).toBe('function');
    expect(typeof api.info).toBe('function');
    expect(typeof api.success).toBe('function');
    expect(typeof api.warning).toBe('function');
    expect(typeof api.error).toBe('function');
    expect(typeof api.destroyAll).toBe('function');
    expect(Array.isArray(api.items)).toBe(true);
  });

  it('injects the message stylesheet into document.head', () => {
    renderHook(() => useMessage());
    const style = document.head.querySelector('style[data-chronix-ui="message"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-message');
  });
});

describe('useNotification', () => {
  it('returns API object with expected methods', () => {
    const { result } = renderHook(() => useNotification());
    const api = result.current;
    expect(typeof api.create).toBe('function');
    expect(typeof api.info).toBe('function');
    expect(typeof api.success).toBe('function');
    expect(typeof api.warning).toBe('function');
    expect(typeof api.error).toBe('function');
    expect(typeof api.destroyAll).toBe('function');
    expect(Array.isArray(api.items)).toBe(true);
  });

  it('injects the notification stylesheet into document.head', () => {
    renderHook(() => useNotification());
    const style = document.head.querySelector('style[data-chronix-ui="notification"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-notification');
  });
});

describe('useDiscreteDialog', () => {
  it('returns API object with expected methods', () => {
    const { result } = renderHook(() => useDiscreteDialog());
    const api = result.current;
    expect(typeof api.create).toBe('function');
    expect(typeof api.info).toBe('function');
    expect(typeof api.success).toBe('function');
    expect(typeof api.warning).toBe('function');
    expect(typeof api.error).toBe('function');
    expect(typeof api.destroy).toBe('function');
    expect(typeof api.destroyAll).toBe('function');
    expect(Array.isArray(api.items)).toBe(true);
  });

  it('injects the discrete-dialog stylesheet into document.head', () => {
    renderHook(() => useDiscreteDialog());
    const style = document.head.querySelector('style[data-chronix-ui="discrete-dialog"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-dialog');
  });
});

describe('useLoadingBar', () => {
  it('returns API object with expected methods', () => {
    const { result } = renderHook(() => useLoadingBar());
    const api = result.current;
    expect(typeof api.start).toBe('function');
    expect(typeof api.finish).toBe('function');
    expect(typeof api.error).toBe('function');
    expect(api.state).toBe('idle');
    expect(Array.isArray(api.classList)).toBe(true);
  });

  it('injects the loading-bar stylesheet into document.head', () => {
    renderHook(() => useLoadingBar());
    const style = document.head.querySelector('style[data-chronix-ui="loading-bar"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-loading-bar');
  });
});
