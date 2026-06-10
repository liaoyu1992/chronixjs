import { describe, expect, it } from 'vitest';

import {
  defaultAvatarProps,
  resolveAvatarContent,
  type AvatarContentInput,
  type AvatarProps,
} from './avatar-spec.js';

function input(over: Partial<AvatarContentInput> = {}): AvatarContentInput {
  return {
    props: defaultAvatarProps,
    imageFailed: false,
    hasFallback: false,
    ...over,
  };
}

describe('defaultAvatarProps', () => {
  it('matches defaults', () => {
    expect(defaultAvatarProps).toEqual({
      src: undefined,
      text: undefined,
      size: 40,
      shape: 'circle',
    });
  });
});

describe('resolveAvatarContent', () => {
  it('renders image when src defined + not errored', () => {
    const props: AvatarProps = { ...defaultAvatarProps, src: '/a.png' };
    expect(resolveAvatarContent(input({ props }))).toBe('image');
  });

  it('falls back to text when image errored', () => {
    const props: AvatarProps = { ...defaultAvatarProps, src: '/a.png', text: 'AB' };
    expect(resolveAvatarContent(input({ props, imageFailed: true }))).toBe('text');
  });

  it('renders text when src undefined', () => {
    const props: AvatarProps = { ...defaultAvatarProps, text: 'AB' };
    expect(resolveAvatarContent(input({ props }))).toBe('text');
  });

  it('renders fallback when neither src nor text', () => {
    expect(resolveAvatarContent(input({ props: defaultAvatarProps, hasFallback: true }))).toBe(
      'fallback',
    );
  });

  it('defaults to text when nothing matches', () => {
    expect(resolveAvatarContent(input())).toBe('text');
  });
});
