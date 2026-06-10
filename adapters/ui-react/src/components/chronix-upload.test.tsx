// @vitest-environment happy-dom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixUpload } from './chronix-upload.js';

describe('ChronixUpload (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the root div with base class and data-testid', () => {
    const { container } = render(<ChronixUpload />);
    const root = container.querySelector('[data-testid="upload-root"]');
    expect(root).not.toBeNull();
    expect(root!.classList.contains('cx-ui-upload')).toBe(true);
  });

  it('mounting ensures the chronix-upload stylesheet is in document.head', () => {
    render(<ChronixUpload />);
    expect(document.head.querySelector('style[data-chronix-ui="upload"]')).not.toBeNull();
  });
});
