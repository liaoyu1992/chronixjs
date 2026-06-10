// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_FOCUSABLE_SELECTOR,
  getFirstFocusable,
  getFocusableElements,
  getLastFocusable,
} from './focus-trap.js';

describe('DEFAULT_FOCUSABLE_SELECTOR', () => {
  it('covers the canonical focusable element shapes', () => {
    expect(DEFAULT_FOCUSABLE_SELECTOR).toContain('a[href]');
    expect(DEFAULT_FOCUSABLE_SELECTOR).toContain('button:not([disabled])');
    expect(DEFAULT_FOCUSABLE_SELECTOR).toContain('input:not([disabled]):not([type="hidden"])');
    expect(DEFAULT_FOCUSABLE_SELECTOR).toContain('[tabindex]');
  });
});

describe('getFocusableElements', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => {
    root.remove();
  });

  it('returns enabled buttons + anchors + inputs + tabindex elements in document order', () => {
    root.innerHTML = `
      <a href="#one">one</a>
      <button>two</button>
      <input type="text" />
      <div tabindex="0">three</div>
    `;
    const els = getFocusableElements(root);
    expect(els).toHaveLength(4);
    expect(els[0]!.tagName).toBe('A');
    expect(els[1]!.tagName).toBe('BUTTON');
    expect(els[2]!.tagName).toBe('INPUT');
    expect(els[3]!.tagName).toBe('DIV');
  });

  it('excludes disabled form controls', () => {
    root.innerHTML = `
      <button>ok</button>
      <button disabled>nope</button>
      <input type="text" disabled />
    `;
    const els = getFocusableElements(root);
    expect(els).toHaveLength(1);
    expect(els[0]!.textContent).toBe('ok');
  });

  it('excludes elements with aria-hidden="true"', () => {
    root.innerHTML = `
      <button>visible</button>
      <button aria-hidden="true">hidden</button>
    `;
    const els = getFocusableElements(root);
    expect(els).toHaveLength(1);
    expect(els[0]!.textContent).toBe('visible');
  });

  it('excludes elements with inline display: none / visibility: hidden', () => {
    root.innerHTML = `
      <button>a</button>
      <button style="display: none">b</button>
      <button style="visibility: hidden">c</button>
    `;
    const els = getFocusableElements(root);
    expect(els).toHaveLength(1);
    expect(els[0]!.textContent).toBe('a');
  });

  it('excludes elements with tabindex="-1"', () => {
    root.innerHTML = `
      <div tabindex="0">in</div>
      <div tabindex="-1">out</div>
    `;
    const els = getFocusableElements(root);
    expect(els).toHaveLength(1);
    expect(els[0]!.textContent).toBe('in');
  });

  it('returns empty array for a root with no focusable descendants', () => {
    root.innerHTML = '<p>just text</p><span>more text</span>';
    expect(getFocusableElements(root)).toEqual([]);
  });
});

describe('getFirstFocusable', () => {
  it('returns the first match', () => {
    const root = document.createElement('div');
    root.innerHTML = '<button>a</button><button>b</button>';
    expect(getFirstFocusable(root)?.textContent).toBe('a');
  });

  it('returns null when nothing focusable exists', () => {
    const root = document.createElement('div');
    root.innerHTML = '<p>x</p>';
    expect(getFirstFocusable(root)).toBeNull();
  });
});

describe('getLastFocusable', () => {
  it('returns the last match', () => {
    const root = document.createElement('div');
    root.innerHTML = '<button>a</button><button>b</button><button>c</button>';
    expect(getLastFocusable(root)?.textContent).toBe('c');
  });

  it('returns null when nothing focusable exists', () => {
    const root = document.createElement('div');
    expect(getLastFocusable(root)).toBeNull();
  });
});
