import { describe, expect, it } from 'vitest';

import {
  createImeCompositionState,
  withCompositionEnd,
  withCompositionStart,
  withCompositionUpdate,
} from './ime-composition-state.js';

describe('createImeCompositionState', () => {
  it('initial state: not composing, empty text', () => {
    const s = createImeCompositionState();
    expect(s.composing).toBe(false);
    expect(s.compositionText).toBe('');
  });
});

describe('withCompositionStart', () => {
  it('transitions to composing with empty text', () => {
    const s = withCompositionStart(createImeCompositionState());
    expect(s.composing).toBe(true);
    expect(s.compositionText).toBe('');
  });

  it('resets compositionText if called mid-composition (defensive)', () => {
    let s = createImeCompositionState();
    s = withCompositionStart(s);
    s = withCompositionUpdate(s, 'partial');
    s = withCompositionStart(s); // double-start (browser bug or programmatic restart)
    expect(s.composing).toBe(true);
    expect(s.compositionText).toBe('');
  });
});

describe('withCompositionUpdate', () => {
  it('records composition text', () => {
    let s = withCompositionStart(createImeCompositionState());
    s = withCompositionUpdate(s, '你好');
    expect(s.composing).toBe(true);
    expect(s.compositionText).toBe('你好');
  });

  it('overwrites previous composition text', () => {
    let s = withCompositionStart(createImeCompositionState());
    s = withCompositionUpdate(s, '你');
    s = withCompositionUpdate(s, '你好');
    expect(s.compositionText).toBe('你好');
  });

  it('returns same reference when text unchanged + already composing', () => {
    const start = withCompositionStart(createImeCompositionState());
    const first = withCompositionUpdate(start, '你');
    const second = withCompositionUpdate(first, '你');
    expect(second).toBe(first);
  });
});

describe('withCompositionEnd', () => {
  it('transitions to not-composing with empty text', () => {
    let s = withCompositionStart(createImeCompositionState());
    s = withCompositionUpdate(s, '你好');
    s = withCompositionEnd(s, '你好');
    expect(s.composing).toBe(false);
    expect(s.compositionText).toBe('');
  });

  it('end can be called on never-started state (defensive)', () => {
    const s = withCompositionEnd(createImeCompositionState(), '');
    expect(s.composing).toBe(false);
    expect(s.compositionText).toBe('');
  });
});

describe('IME lifecycle — full cycle', () => {
  it('start → update → update → end', () => {
    let s = createImeCompositionState();
    expect(s.composing).toBe(false);

    s = withCompositionStart(s);
    expect(s.composing).toBe(true);
    expect(s.compositionText).toBe('');

    s = withCompositionUpdate(s, 'n');
    expect(s.compositionText).toBe('n');

    s = withCompositionUpdate(s, 'ni');
    expect(s.compositionText).toBe('ni');

    s = withCompositionEnd(s, '你');
    expect(s.composing).toBe(false);
    expect(s.compositionText).toBe('');
  });
});
