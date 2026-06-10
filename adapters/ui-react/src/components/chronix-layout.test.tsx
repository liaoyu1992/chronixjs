import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixLayoutContent } from './chronix-layout-content.js';
import { ChronixLayoutFooter } from './chronix-layout-footer.js';
import { ChronixLayoutHeader } from './chronix-layout-header.js';
import { ChronixLayoutSider } from './chronix-layout-sider.js';
import { ChronixLayout } from './chronix-layout.js';

describe('ChronixLayout (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the layout container with base class', () => {
    const { container } = render(
      <ChronixLayout>
        <ChronixLayoutContent>body</ChronixLayoutContent>
      </ChronixLayout>,
    );
    const root = container.querySelector('.cx-ui-layout');
    expect(root).not.toBeNull();
  });

  it('auto-detects --has-sider when a ChronixLayoutSider child is present', () => {
    const { container } = render(
      <ChronixLayout>
        <ChronixLayoutSider>sider</ChronixLayoutSider>
        <ChronixLayoutContent>body</ChronixLayoutContent>
      </ChronixLayout>,
    );
    expect(container.querySelector('.cx-ui-layout--has-sider')).not.toBeNull();
  });

  it('does NOT add --has-sider when no sider is in the slot', () => {
    const { container } = render(
      <ChronixLayout>
        <ChronixLayoutHeader>h</ChronixLayoutHeader>
        <ChronixLayoutContent>c</ChronixLayoutContent>
        <ChronixLayoutFooter>f</ChronixLayoutFooter>
      </ChronixLayout>,
    );
    expect(container.querySelector('.cx-ui-layout--has-sider')).toBeNull();
  });

  it('respects explicit hasSider prop override', () => {
    const { container } = render(
      <ChronixLayout hasSider>
        <ChronixLayoutContent>x</ChronixLayoutContent>
      </ChronixLayout>,
    );
    expect(container.querySelector('.cx-ui-layout--has-sider')).not.toBeNull();
  });

  it('injects the chronix-layout stylesheet', () => {
    render(<ChronixLayout>x</ChronixLayout>);
    expect(document.head.querySelector('style[data-chronix-ui="layout"]')).not.toBeNull();
  });
});

describe('ChronixLayoutSider (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders sider with width inline style', () => {
    const { container } = render(<ChronixLayoutSider width={240} />);
    const aside = container.querySelector<HTMLElement>('aside.cx-ui-layout__sider')!;
    expect(aside.style.width).toBe('240px');
  });

  it('switches to collapsedWidth when collapsed', () => {
    const { container } = render(<ChronixLayoutSider collapsed width={200} collapsedWidth={64} />);
    const aside = container.querySelector<HTMLElement>('aside.cx-ui-layout__sider')!;
    expect(aside.style.width).toBe('64px');
    expect(aside.classList.contains('cx-ui-layout__sider--collapsed')).toBe(true);
  });

  it('renders trigger button when collapsible=true', () => {
    const { container } = render(<ChronixLayoutSider collapsible />);
    expect(container.querySelector('.cx-ui-layout__sider-trigger')).not.toBeNull();
  });
});

describe('ChronixLayout sub-components (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('header / content / footer carry their respective BEM class', () => {
    const h = render(<ChronixLayoutHeader>h</ChronixLayoutHeader>);
    expect(h.container.querySelector('.cx-ui-layout__header')).not.toBeNull();
    cleanup();
    const c = render(<ChronixLayoutContent>c</ChronixLayoutContent>);
    expect(c.container.querySelector('.cx-ui-layout__content')).not.toBeNull();
    cleanup();
    const f = render(<ChronixLayoutFooter>f</ChronixLayoutFooter>);
    expect(f.container.querySelector('.cx-ui-layout__footer')).not.toBeNull();
  });
});
