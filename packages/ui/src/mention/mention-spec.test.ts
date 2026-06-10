import { describe, expect, it } from 'vitest';

import {
  defaultMentionProps,
  detectMentionTrigger,
  detectMultiMentionTrigger,
} from './mention-spec.js';

describe('defaultMentionProps', () => {
  it('has correct defaults', () => {
    expect(defaultMentionProps).toEqual({
      value: '',
      options: [],
      trigger: '@',
      placement: 'bottom-start',
      disabled: false,
      placeholder: '',
      sources: [],
      filter: undefined,
    });
  });
});

describe('detectMentionTrigger', () => {
  it('detects @ at start of input', () => {
    const result = detectMentionTrigger('hello @jo', 9, '@');
    expect(result.detected).toBe(true);
    expect(result.query).toBe('jo');
    expect(result.startIndex).toBe(6);
  });

  it('detects @ after space', () => {
    const result = detectMentionTrigger('hello @world', 12, '@');
    expect(result.detected).toBe(true);
    expect(result.query).toBe('world');
  });

  it('returns false when no trigger found', () => {
    const result = detectMentionTrigger('hello world', 11, '@');
    expect(result.detected).toBe(false);
  });

  it('returns false when cursor is before trigger', () => {
    const result = detectMentionTrigger('hello @world', 5, '@');
    expect(result.detected).toBe(false);
  });

  it('returns false when trigger not preceded by whitespace', () => {
    const result = detectMentionTrigger('email@domain', 12, '@');
    expect(result.detected).toBe(false);
  });

  it('returns false for empty query after trigger', () => {
    const result = detectMentionTrigger('hello @', 7, '@');
    expect(result.detected).toBe(true);
    expect(result.query).toBe('');
  });

  it('returns false when query contains space', () => {
    const result = detectMentionTrigger('hello @john doe', 15, '@');
    expect(result.detected).toBe(false);
  });

  it('detects custom trigger', () => {
    const result = detectMentionTrigger('hello #tag', 10, '#');
    expect(result.detected).toBe(true);
    expect(result.query).toBe('tag');
  });

  it('returns false for cursor at 0', () => {
    const result = detectMentionTrigger('@hello', 0, '@');
    expect(result.detected).toBe(false);
  });

  it('detects trigger after newline', () => {
    const result = detectMentionTrigger('line1\n@user', 11, '@');
    expect(result.detected).toBe(true);
    expect(result.query).toBe('user');
  });
});

describe('detectMultiMentionTrigger', () => {
  const triggers = ['@', '#', ':'] as const;

  it('finds @ trigger with query', () => {
    const result = detectMultiMentionTrigger('hello @jo', 9, triggers);
    expect(result).toEqual({
      matchedTrigger: '@',
      query: 'jo',
      triggerStart: 6,
    });
  });

  it('finds # trigger with query', () => {
    const result = detectMultiMentionTrigger('hello #tag', 10, triggers);
    expect(result).toEqual({
      matchedTrigger: '#',
      query: 'tag',
      triggerStart: 6,
    });
  });

  it('finds : trigger with query', () => {
    const result = detectMultiMentionTrigger('hello :smile', 12, triggers);
    expect(result).toEqual({
      matchedTrigger: ':',
      query: 'smile',
      triggerStart: 6,
    });
  });

  it('returns null when no trigger found', () => {
    const result = detectMultiMentionTrigger('hello world', 11, triggers);
    expect(result).toBeNull();
  });

  it('returns first match when multiple triggers could match (closest to cursor)', () => {
    const result = detectMultiMentionTrigger('@user #tag', 10, triggers);
    expect(result).toEqual({
      matchedTrigger: '#',
      query: 'tag',
      triggerStart: 6,
    });
  });

  it('handles empty string', () => {
    const result = detectMultiMentionTrigger('', 0, triggers);
    expect(result).toBeNull();
  });

  it('returns null when triggers array is empty', () => {
    const result = detectMultiMentionTrigger('hello @world', 12, []);
    expect(result).toBeNull();
  });

  it('returns null when query contains space', () => {
    const result = detectMultiMentionTrigger('hello @john doe', 15, triggers);
    expect(result).toBeNull();
  });

  it('returns null when trigger is not preceded by whitespace', () => {
    const result = detectMultiMentionTrigger('email@domain', 12, triggers);
    expect(result).toBeNull();
  });
});
