import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChronixTree } from './chronix-tree.js';

import type { TreeNodeData, TreeNodeSpec } from '@chronixjs/ui';

type TestNode = TreeNodeSpec<TreeNodeData>;

const LEAF_B: TestNode = { key: 'b', data: { label: 'B', isLeaf: true } };
const ITEMS: readonly TestNode[] = [
  {
    key: 'a',
    data: { label: 'A' },
    children: [{ key: 'a.1', data: { label: 'A.1', isLeaf: true } }],
  },
  LEAF_B,
];

describe('ChronixTree (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders root div with role=tree', () => {
    const { container } = render(<ChronixTree items={ITEMS} />);
    const root = container.firstElementChild as HTMLDivElement;
    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('role')).toBe('tree');
    expect(root.classList.contains('cx-ui-tree')).toBe(true);
  });

  it('renders visible rows matching items + expanded state', () => {
    const { container } = render(<ChronixTree items={ITEMS} expandedKeys={new Set(['a'])} />);
    const rows = container.querySelectorAll('[role="treeitem"]');
    expect(rows.length).toBe(3);
  });

  it('selects a leaf and fires onValueChange + onSelect', () => {
    const onValueChange = vi.fn();
    const onSelect = vi.fn();
    const { container } = render(
      <ChronixTree items={ITEMS} onValueChange={onValueChange} onSelect={onSelect} />,
    );
    const rows = container.querySelectorAll('[role="treeitem"]');
    fireEvent.click(rows[rows.length - 1]!);
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(onSelect).toHaveBeenCalledWith('b', expect.objectContaining({ key: 'b' }));
  });

  it('toggles expand on branch click', () => {
    const onExpandedKeysChange = vi.fn();
    const { container } = render(
      <ChronixTree items={ITEMS} onExpandedKeysChange={onExpandedKeysChange} />,
    );
    let rows = container.querySelectorAll('[role="treeitem"]');
    expect(rows.length).toBe(2);
    fireEvent.click(rows[0]!);
    rows = container.querySelectorAll('[role="treeitem"]');
    expect(rows.length).toBe(3);
    expect(onExpandedKeysChange).toHaveBeenCalled();
  });

  it('supports drag-and-drop reorder', () => {
    const onReorder = vi.fn();
    const { container } = render(<ChronixTree items={ITEMS} draggable onReorder={onReorder} />);
    const rows = container.querySelectorAll('[role="treeitem"]');
    // dragstart on b
    fireEvent.dragStart(rows[1]!, {
      dataTransfer: {
        setData: () => {
          /* noop */
        },
        effectAllowed: 'move',
      },
    });
    // dragover on a (bottom zone)
    fireEvent.dragOver(rows[0]!, {
      dataTransfer: { dropEffect: 'move' },
      clientY: 27,
      preventDefault: () => {
        /* noop */
      },
    });
    // drop on a
    fireEvent.drop(rows[0]!, {
      preventDefault: () => {
        /* noop */
      },
    });
    expect(onReorder).toHaveBeenCalled();
  });

  it('renders virtual viewport when virtual=true', () => {
    const { container } = render(
      <ChronixTree items={ITEMS} virtual height={100} expandedKeys={new Set(['a'])} />,
    );
    expect(container.querySelector('.cx-ui-tree__viewport')).not.toBeNull();
  });

  it('injects the chronix-tree stylesheet', () => {
    render(<ChronixTree items={ITEMS} />);
    expect(document.head.querySelector('style[data-chronix-ui="tree"]')).not.toBeNull();
  });
});
