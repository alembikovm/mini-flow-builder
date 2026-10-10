import { describe, expect, it } from 'vitest';
import {
  beginTransaction,
  cancelTransaction,
  canRedo,
  canUndo,
  commit,
  commitTransaction,
  initHistory,
  redo,
  undo,
} from '../history';
import { addNode, moveNode, removeNode, updateProps, updateStyle } from '../ops';
import { createSeedDoc } from '../seed';
import { isStack, type Doc, type StackNode } from '../model';

function freshState() {
  return initHistory<Doc>(createSeedDoc());
}

function welcomeRoot(doc: Doc): StackNode {
  const screen = Object.values(doc.screens).find((s) => s.name === 'Welcome')!;
  const n = doc.nodes[screen.rootId];
  if (!n || !isStack(n)) throw new Error('welcome root missing');
  return n;
}

describe('add / undo / redo round-trip', () => {
  it('addNode is reversible', () => {
    let s = freshState();
    const beforeCount = Object.keys(s.doc.nodes).length;
    const beforeChildren = welcomeRoot(s.doc).children.length;

    let addedId = '';
    s = commit(s, 'add text', (d) => {
      addedId = addNode(d, 'text', { parentId: welcomeRoot(d).id });
    });
    expect(canUndo(s)).toBe(true);
    expect(Object.keys(s.doc.nodes).length).toBe(beforeCount + 1);
    expect(s.doc.nodes[addedId]).toBeDefined();

    s = undo(s);
    expect(canUndo(s)).toBe(false);
    expect(canRedo(s)).toBe(true);
    expect(Object.keys(s.doc.nodes).length).toBe(beforeCount);
    expect(welcomeRoot(s.doc).children.length).toBe(beforeChildren);
    expect(s.doc.nodes[addedId]).toBeUndefined();

    s = redo(s);
    expect(canRedo(s)).toBe(false);
    expect(s.doc.nodes[addedId]).toBeDefined();
    expect(welcomeRoot(s.doc).children.length).toBe(beforeChildren + 1);
  });

  it('removeNode is reversible and restores the subtree', () => {
    let s = freshState();
    const root = welcomeRoot(s.doc);
    const targetId = root.children[0]!;
    const beforeNode = structuredClone(s.doc.nodes[targetId]);

    s = commit(s, 'remove', (d) => removeNode(d, targetId));
    expect(s.doc.nodes[targetId]).toBeUndefined();
    s = undo(s);
    expect(s.doc.nodes[targetId]).toEqual(beforeNode);
    expect(welcomeRoot(s.doc).children[0]).toBe(targetId);
  });

  it('moveNode undo restores the exact original index', () => {
    let s = freshState();
    const root = welcomeRoot(s.doc);
    const target = root.children[0]!;
    const originalIndex = 0;
    const newIndex = root.children.length - 1;

    s = commit(s, 'move', (d) => moveNode(d, target, { parentId: welcomeRoot(d).id, index: newIndex + 1 }));
    expect(welcomeRoot(s.doc).children[newIndex]).toBe(target);

    s = undo(s);
    expect(welcomeRoot(s.doc).children[originalIndex]).toBe(target);
  });
});

describe('coalescing', () => {
  it('merges consecutive commits with the same coalesceKey within window', () => {
    let s = freshState();
    const root = welcomeRoot(s.doc);
    const textId = root.children.find((id) => s.doc.nodes[id]?.type === 'text')!;
    const originalContent = (s.doc.nodes[textId] as { props: { content: string } }).props.content;

    s = commit(s, 'edit text', (d) => updateProps(d, textId, 'text', { content: 'A' }), {
      coalesceKey: `text:${textId}:content`,
      now: 0,
    });
    s = commit(s, 'edit text', (d) => updateProps(d, textId, 'text', { content: 'AB' }), {
      coalesceKey: `text:${textId}:content`,
      now: 100,
    });
    s = commit(s, 'edit text', (d) => updateProps(d, textId, 'text', { content: 'ABC' }), {
      coalesceKey: `text:${textId}:content`,
      now: 200,
    });
    expect(s.past.length).toBe(1);

    s = undo(s);
    const content = (s.doc.nodes[textId] as { props: { content: string } }).props.content;
    expect(content).toBe(originalContent);
  });

  it('does NOT coalesce after the window elapses', () => {
    let s = freshState();
    const root = welcomeRoot(s.doc);
    const textId = root.children.find((id) => s.doc.nodes[id]?.type === 'text')!;

    s = commit(s, 'edit', (d) => updateProps(d, textId, 'text', { content: 'A' }), {
      coalesceKey: `text:${textId}`,
      now: 0,
    });
    s = commit(s, 'edit', (d) => updateProps(d, textId, 'text', { content: 'AB' }), {
      coalesceKey: `text:${textId}`,
      now: 600,
    });
    expect(s.past.length).toBe(2);
  });

  it('does NOT coalesce across different keys', () => {
    let s = freshState();
    const root = welcomeRoot(s.doc);
    const children = root.children;
    const first = children[0]!;
    const second = children[1]!;

    s = commit(s, 'rename', (d) => {
      const n = d.nodes[first]!;
      n.name = 'A';
    }, { coalesceKey: `name:${first}`, now: 0 });
    s = commit(s, 'rename', (d) => {
      const n = d.nodes[second]!;
      n.name = 'B';
    }, { coalesceKey: `name:${second}`, now: 100 });

    expect(s.past.length).toBe(2);
  });
});

describe('redo stack', () => {
  it('is cleared when a new commit is made', () => {
    let s = freshState();
    s = commit(s, 'a', (d) => addNode(d, 'text', { parentId: welcomeRoot(d).id }));
    s = commit(s, 'b', (d) => addNode(d, 'text', { parentId: welcomeRoot(d).id }));
    s = undo(s);
    expect(canRedo(s)).toBe(true);
    s = commit(s, 'c', (d) => addNode(d, 'text', { parentId: welcomeRoot(d).id }));
    expect(canRedo(s)).toBe(false);
    expect(s.future.length).toBe(0);
  });
});

describe('transactions', () => {
  it('groups multiple commits into one history entry', () => {
    let s = freshState();
    const root = welcomeRoot(s.doc);
    const textId = root.children.find((id) => s.doc.nodes[id]?.type === 'text')!;

    s = beginTransaction(s, 'scrub padding');
    for (let v = 1; v <= 5; v++) {
      s = commit(s, 'padding', (d) => updateStyle(d, textId, { padding: { top: v, right: 0, bottom: 0, left: 0 } }));
    }
    expect(s.past.length).toBe(0);
    expect(s.pendingTx).not.toBeNull();

    s = commitTransaction(s);
    expect(s.past.length).toBe(1);
    expect(s.pendingTx).toBeNull();
    expect((s.doc.nodes[textId] as { style: { padding: { top: number } } }).style.padding.top).toBe(5);

    // Single undo rolls back everything.
    s = undo(s);
    const n = s.doc.nodes[textId] as { style: { padding?: { top: number } } };
    expect(n.style.padding?.top ?? 0).toBe(0);
  });

  it('cancelTransaction reverts intermediate state', () => {
    let s = freshState();
    const root = welcomeRoot(s.doc);
    const textId = root.children.find((id) => s.doc.nodes[id]?.type === 'text')!;
    const originalPadding = (s.doc.nodes[textId] as { style: { padding?: { top: number } } }).style.padding;

    s = beginTransaction(s, 'scrub');
    s = commit(s, 'p', (d) => updateStyle(d, textId, { padding: { top: 99, right: 0, bottom: 0, left: 0 } }));
    s = cancelTransaction(s);

    const after = (s.doc.nodes[textId] as { style: { padding?: { top: number } } }).style.padding;
    expect(after).toEqual(originalPadding);
    expect(s.past.length).toBe(0);
    expect(s.pendingTx).toBeNull();
  });

  it('empty transaction (no commits between begin and commit) is a no-op', () => {
    let s = freshState();
    s = beginTransaction(s, 'empty');
    s = commitTransaction(s);
    expect(s.past.length).toBe(0);
  });

  it('throws when nesting transactions', () => {
    let s = freshState();
    s = beginTransaction(s, 'outer');
    expect(() => beginTransaction(s, 'inner')).toThrow();
  });

  it('throws when undoing mid-transaction', () => {
    let s = freshState();
    s = beginTransaction(s, 't');
    expect(() => undo(s)).toThrow();
  });
});

describe('idempotence', () => {
  it('a no-op recipe does not create a history entry', () => {
    let s = freshState();
    s = commit(s, 'noop', () => {
      /* no mutations */
    });
    expect(s.past.length).toBe(0);
  });
});
