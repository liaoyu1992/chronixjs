// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixUpload } from './chronix-upload.js';

/**
 * — Upload mount tests (vue3).
 */
describe('ChronixUpload', () => {
  it('renders a div with base class and data-testid', () => {
    const wrapper = mount(ChronixUpload, {
      props: { action: '/api/upload' },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-upload');
    expect(wrapper.attributes('data-testid')).toBe('upload-root');
  });

  it('injects the chronix-upload stylesheet', () => {
    mount(ChronixUpload);
    expect(document.head.querySelector('style[data-chronix-ui="upload"]')).not.toBeNull();
  });
});
