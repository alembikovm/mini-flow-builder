import { describe, expect, it } from 'vitest';
import {
  addNode,
  addScreen,
  duplicateNode,
  findButtonsReferencing,
  insertNode,
  moveNode,
  OpError,
  removeNode,
  removeScreen,
  renameNode,
  renameScreen,
  reorderScreens,
  updateProps,
  updateStyle,
} from '../ops';
import { createSeedDoc } from '../seed';
import { createNode } from '../defaults';
import { isStack, type Doc, type StackNode } from '../model';

function freshDoc(): Doc {
  // structuredClone keeps tests independent even though ops mutate in place.
  return structuredClone(createSeedDoc());
}

function screenRoot(doc: Doc, screenName: string): StackNode {
  const screen = Object.values(doc.screens).find((s) => s.name === screenName)!;
  const root = doc.nodes[screen.rootId];
  if (!root || !isStack(root)) throw new Error('root not found');
  return root;
}

describe('addNode / insertNode', () => {
  it('appends to end when no index is given', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const before = root.children.length;
    const id = addNode(doc, 'spacer', { parentId: root.id });
    expect(root.children[root.children.length - 1]).toBe(id);
    expect(root.children.length).toBe(before + 1);
    expect(doc.nodes[id]?.parentId).toBe(root.id);
  });

  it('inserts at index 0', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const id = addNode(doc, 'text', { parentId: root.id, index: 0 });
    expect(root.children[0]).toBe(id);
  });

  it('clamps out-of-range index to the end', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const id = addNode(doc, 'text', { parentId: root.id, index: 9999 });
    expect(root.children[root.children.length - 1]).toBe(id);
  });

  it('refuses to insert into a non-stack parent', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const textId = root.children.find((id) => doc.nodes[id]?.type === 'text')!;
    expect(() => addNode(doc, 'text', { parentId: textId })).toThrow(OpError);
  });

  it('insertNode registers detached subtree nodes passed via extras', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const parent = createNode('stack', { name: 'Group' }) as StackNode;
    const child = createNode('text');
    parent.children.push(child.id);
    child.parentId = parent.id;
    insertNode(doc, parent, { parentId: root.id }, { [child.id]: child });
    expect(doc.nodes[parent.id]).toBeDefined();
    expect(doc.nodes[child.id]).toBeDefined();
    expect(doc.nodes[child.id]?.parentId).toBe(parent.id);
  });
});

describe('removeNode', () => {
  it('removes a leaf and unlinks from parent', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const target = root.children[0]!;
    removeNode(doc, target);
    expect(doc.nodes[target]).toBeUndefined();
    expect(root.children.includes(target)).toBe(false);
  });

  it('removes an entire subtree', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const groupId = addNode(doc, 'stack', { parentId: root.id });
    const a = addNode(doc, 'text', { parentId: groupId });
    const b = addNode(doc, 'text', { parentId: groupId });
    removeNode(doc, groupId);
    expect(doc.nodes[groupId]).toBeUndefined();
    expect(doc.nodes[a]).toBeUndefined();
    expect(doc.nodes[b]).toBeUndefined();
  });

  it('refuses to remove a screen root', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    expect(() => removeNode(doc, root.id)).toThrow(OpError);
  });
});

describe('moveNode', () => {
  it('moves within the same parent to a later index (compensates for removal)', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const first = root.children[0]!;
    moveNode(doc, first, { parentId: root.id, index: root.children.length });
    expect(root.children[root.children.length - 1]).toBe(first);
  });

  it('moves across parents', () => {
    const doc = freshDoc();
    const welcome = screenRoot(doc, 'Welcome');
    const quiz = screenRoot(doc, 'Quiz');
    const target = welcome.children[0]!;
    moveNode(doc, target, { parentId: quiz.id, index: 0 });
    expect(welcome.children.includes(target)).toBe(false);
    expect(quiz.children[0]).toBe(target);
    expect(doc.nodes[target]?.parentId).toBe(quiz.id);
  });

  it('rejects moving a node into its own descendant (cycle)', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const group = addNode(doc, 'stack', { parentId: root.id });
    const inner = addNode(doc, 'stack', { parentId: group });
    expect(() => moveNode(doc, group, { parentId: inner, index: 0 })).toThrow(OpError);
  });
});

describe('duplicateNode', () => {
  it('inserts a deep copy next to the original with new ids', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const groupId = addNode(doc, 'stack', { parentId: root.id });
    const childId = addNode(doc, 'text', { parentId: groupId });

    const cloneId = duplicateNode(doc, groupId);
    expect(cloneId).not.toBe(groupId);

    const clone = doc.nodes[cloneId];
    expect(clone?.type).toBe('stack');
    if (clone && isStack(clone)) {
      expect(clone.children).toHaveLength(1);
      const cloneChildId = clone.children[0]!;
      expect(cloneChildId).not.toBe(childId);
      // Props deep-copied by value.
      const origText = doc.nodes[childId];
      const cloneText = doc.nodes[cloneChildId];
      if (origText?.type === 'text' && cloneText?.type === 'text') {
        expect(cloneText.props.content).toBe(origText.props.content);
      }
    }
    // Position: clone sits immediately after original in parent children.
    const idxOrig = root.children.indexOf(groupId);
    const idxClone = root.children.indexOf(cloneId);
    expect(idxClone).toBe(idxOrig + 1);
  });
});

describe('updateProps / updateStyle / renameNode', () => {
  it('updateProps merges and is type-checked at the type level', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const textId = addNode(doc, 'text', { parentId: root.id });
    updateProps(doc, textId, 'text', { content: 'Hello' });
    const n = doc.nodes[textId];
    expect(n?.type === 'text' && n.props.content).toBe('Hello');
  });

  it('updateProps throws on a type mismatch at runtime', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    const textId = addNode(doc, 'text', { parentId: root.id });
    expect(() => updateProps(doc, textId, 'button', { label: 'x' } as never)).toThrow(OpError);
  });

  it('updateStyle merges partial style patches', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    updateStyle(doc, root.id, { gap: 32 });
    const node = doc.nodes[root.id];
    expect(node?.style.gap).toBe(32);
  });

  it('renameNode sets the display name', () => {
    const doc = freshDoc();
    const root = screenRoot(doc, 'Welcome');
    renameNode(doc, root.id, 'Container');
    expect(doc.nodes[root.id]?.name).toBe('Container');
  });
});

describe('screens', () => {
  it('addScreen appends a screen with a stack root', () => {
    const doc = freshDoc();
    const sid = addScreen(doc, 'Extra');
    expect(doc.screenOrder[doc.screenOrder.length - 1]).toBe(sid);
    const screen = doc.screens[sid];
    expect(screen?.name).toBe('Extra');
    const root = doc.nodes[screen!.rootId];
    expect(root?.type).toBe('stack');
    expect(root?.parentId).toBe(null);
  });

  it('renameScreen changes only the name', () => {
    const doc = freshDoc();
    const first = doc.screenOrder[0]!;
    renameScreen(doc, first, 'Hello');
    expect(doc.screens[first]?.name).toBe('Hello');
  });

  it('removeScreen deletes the screen and all its nodes', () => {
    const doc = freshDoc();
    const screen = Object.values(doc.screens).find((s) => s.name === 'Quiz')!;
    const descendants: string[] = [];
    const walk = (id: string): void => {
      descendants.push(id);
      const n = doc.nodes[id];
      if (n && isStack(n)) for (const c of n.children) walk(c);
    };
    walk(screen.rootId);

    removeScreen(doc, screen.id);
    expect(doc.screens[screen.id]).toBeUndefined();
    expect(doc.screenOrder.includes(screen.id)).toBe(false);
    for (const id of descendants) expect(doc.nodes[id]).toBeUndefined();
  });

  it('removeScreen refuses to remove the last screen', () => {
    const doc = freshDoc();
    for (const sid of [...doc.screenOrder].slice(1)) removeScreen(doc, sid);
    expect(doc.screenOrder.length).toBe(1);
    expect(() => removeScreen(doc, doc.screenOrder[0]!)).toThrow(OpError);
  });

  it('removeScreen downgrades buttons that navigated to it', () => {
    const doc = freshDoc();
    const quiz = Object.values(doc.screens).find((s) => s.name === 'Quiz')!;
    const refs = findButtonsReferencing(doc, quiz.id);
    expect(refs.length).toBeGreaterThan(0);

    removeScreen(doc, quiz.id);
    for (const id of refs) {
      const n = doc.nodes[id];
      if (n?.type === 'button') expect(n.props.action.type).toBe('none');
    }
  });

  it('reorderScreens moves ids correctly', () => {
    const doc = freshDoc();
    const original = [...doc.screenOrder];
    reorderScreens(doc, 0, 2);
    expect(doc.screenOrder[2]).toBe(original[0]);
    expect(doc.screenOrder[0]).toBe(original[1]);
    expect(doc.screenOrder[1]).toBe(original[2]);
  });
});
