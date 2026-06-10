import { resetPopupZIndexForTests, type SelectOption } from '@chronixjs/ui';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixCascader } from './chronix-cascader.js';

const CASCADE_OPTS: readonly SelectOption[] = [
  {
    key: 'zhejiang',
    label: 'Zhejiang',
    children: [{ key: 'hangzhou', label: 'Hangzhou', value: 'hangzhou' }],
  },
  {
    key: 'jiangsu',
    label: 'Jiangsu',
    children: [{ key: 'nanjing', label: 'Nanjing', value: 'nanjing' }],
  },
];

describe('ChronixCascader (react)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders root with data-testid cascader-root', () => {
    render(<ChronixCascader options={CASCADE_OPTS} />);
    expect(document.querySelector('[data-testid="cascader-root"]')).not.toBeNull();
  });

  it('shows root-level options when open', () => {
    render(<ChronixCascader options={CASCADE_OPTS} show />);
    const dropdown = document.querySelector('[data-testid="cascader-dropdown-popup"]');
    expect(dropdown).not.toBeNull();
    expect(dropdown!.querySelectorAll('.cx-ui-cascader__option')).toHaveLength(2);
  });

  it('injects the chronix-cascader stylesheet', () => {
    render(<ChronixCascader options={CASCADE_OPTS} />);
    expect(document.head.querySelector('style[data-chronix-ui="cascader"]')).not.toBeNull();
  });
});
