// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixUpload } from './chronix-upload.js';

const Upload = ChronixUpload as unknown as VueConstructor;

describe('ChronixUpload (vue2)', () => {
  it('renders a <div> with base cx-ui-upload class and trigger button', () => {
    const wrapper = mount(Upload);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-upload');
    expect(wrapper.find('.cx-ui-upload__trigger').exists()).toBe(true);
  });

  it('injects the chronix-upload stylesheet into document.head', () => {
    mount(Upload);
    expect(document.head.querySelector('style[data-chronix-ui="upload"]')).not.toBeNull();
  });
});
