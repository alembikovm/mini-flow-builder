// Pure document operations. Every function takes a `Doc` (as an immer draft or
// a plain object — these are intended to be called inside `produce` from
// history.ts) and mutates it in place. No history, no undo, no store wiring.

import type {
  Doc,
  Node,
  NodeId,
  NodeStyle,
  NodeType,
  PropsOfType,
  Screen,
  ScreenId,
  StackNode,
} from './model';
import { isStack } from './model';
import { newNodeId, newScreenId } from './ids';
import { createNode } from './defaults';

// ---------- Invariant helpers ------------------------------------------------

export class OpError extends Error {}

function requireNode(doc: Doc, id: NodeId): Node {
  const n = doc.nodes[id];
  if (!n) throw new OpError(`node ${id} not found`);
  return n;
}

function requireStack(doc: Doc, id: NodeId): StackNode {
  const n = requireNode(doc, id);
  if (!isStack(n)) throw new OpError(`node ${id} is not a stack`);
  return n;
}

function requireScreen(doc: Doc, id: ScreenId): Screen {
  const s = doc.screens[id];
  if (!s) throw new OpError(`screen ${id} not found`);
  return s;
}

// Walks ancestors; used to reject moves that would create a cycle.
function isAncestor(doc: Doc, ancestorId: NodeId, nodeId: NodeId): boolean {
  let cur: NodeId | null = nodeId;
  while (cur) {
    if (cur === ancestorId) return true;
    const n: Node | undefined = doc.nodes[cur];
    cur = n?.parentId ?? null;
  }
  return false;
}

// ---------- Node tree --------------------------------------------------------

export type AddNodePosition = { parentId: NodeId; index?: number };

/**
 * Insert an already-constructed node (and optionally its subtree) into the doc.
 * The caller usually passes the result of `createNode(type)`. Children are
 * taken from the node itself and must already exist on `doc.nodes` *or* be
 * provided via `extraNodes` (used by duplicateNode).
 */
export function insertNode(
  doc: Doc,
  node: Node,
  position: AddNodePosition,
  extraNodes: Record<NodeId, Node> = {},
): void {
  const parent = requireStack(doc, position.parentId);
  // Register the new node + any detached subtree nodes.
  doc.nodes[node.id] = node;
  for (const n of Object.values(extraNodes)) doc.nodes[n.id] = n;

  node.parentId = parent.id;
  const idx = clampInsertIndex(position.index, parent.children.length);
  parent.children.splice(idx, 0, node.id);
}

/** Convenience: build a default node of the given type and insert it. */
export function addNode(doc: Doc, type: NodeType, position: AddNodePosition): NodeId {
  const node = createNode(type);
  insertNode(doc, node, position);
  return node.id;
}

/** Remove node + its entire subtree. Fails on screen roots. */
export function removeNode(doc: Doc, nodeId: NodeId): void {
  const node = requireNode(doc, nodeId);
  if (node.parentId === null) {
    throw new OpError(`cannot remove screen root ${nodeId}`);
  }
  const parent = requireStack(doc, node.parentId);
  const i = parent.children.indexOf(nodeId);
  if (i >= 0) parent.children.splice(i, 1);

  const toDelete: NodeId[] = [];
  walkSubtree(doc, nodeId, (n) => toDelete.push(n.id));
  for (const id of toDelete) delete doc.nodes[id];
}

/**
 * Move node to a new parent + index. Operates on the normalized map, so cost
 * is O(1) regardless of subtree size: unlink from old parent's children, link
 * into new parent's children, update `parentId`.
 */
export function moveNode(
  doc: Doc,
  nodeId: NodeId,
  target: { parentId: NodeId; index: number },
): void {
  const node = requireNode(doc, nodeId);
  if (node.parentId === null) throw new OpError(`cannot move screen root ${nodeId}`);
  if (nodeId === target.parentId) throw new OpError(`cannot move node into itself`);
  if (isAncestor(doc, nodeId, target.parentId)) {
    throw new OpError(`cannot move node into its own descendant`);
  }

  const oldParent = requireStack(doc, node.parentId);
  const newParent = requireStack(doc, target.parentId);

  // Compute the final index first, accounting for the removal when moving
  // within the same parent to a later position.
  const oldIndex = oldParent.children.indexOf(nodeId);
  oldParent.children.splice(oldIndex, 1);

  let finalIndex = clampInsertIndex(target.index, newParent.children.length);
  if (oldParent.id === newParent.id && target.index > oldIndex) {
    finalIndex = clampInsertIndex(target.index - 1, newParent.children.length);
  }

  newParent.children.splice(finalIndex, 0, nodeId);
  node.parentId = newParent.id;
}

/** Deep-clone a node + its subtree and insert next to the original. */
export function duplicateNode(doc: Doc, nodeId: NodeId): NodeId {
  const node = requireNode(doc, nodeId);
  if (node.parentId === null) throw new OpError(`cannot duplicate screen root ${nodeId}`);
  const parent = requireStack(doc, node.parentId);

  const idMap = new Map<NodeId, NodeId>();
  const extras: Record<NodeId, Node> = {};
  const clone = cloneSubtree(doc, nodeId, null, idMap, extras);
  const originalIndex = parent.children.indexOf(nodeId);
  insertNode(doc, clone, { parentId: parent.id, index: originalIndex + 1 }, extras);
  return clone.id;
}

// ---------- Props & style ----------------------------------------------------

/**
 * Shallow-merge into `node.props`. Typed so you can't write ButtonProps into
 * a text node. Pass `null` to a key to remove it.
 */
export function updateProps<T extends NodeType>(
  doc: Doc,
  nodeId: NodeId,
  type: T,
  patch: Partial<PropsOfType<T>>,
): void {
  const n = requireNode(doc, nodeId);
  if (n.type !== type) throw new OpError(`expected ${type}, got ${n.type}`);
  // Immer draft: mutate in place.
  Object.assign(n.props as object, patch);
}

export function updateStyle(doc: Doc, nodeId: NodeId, patch: Partial<NodeStyle>): void {
  const n = requireNode(doc, nodeId);
  Object.assign(n.style, patch);
}

export function renameNode(doc: Doc, nodeId: NodeId, name: string): void {
  const n = requireNode(doc, nodeId);
  n.name = name;
}

// ---------- Screens ----------------------------------------------------------

export function addScreen(doc: Doc, name = 'Screen'): ScreenId {
  const screenId = newScreenId();
  // Build the root inline rather than via createNode so the id → screen link
  // is explicit at the only place that creates a screen root.
  const rootId = newNodeId();
  const root: StackNode = {
    id: rootId,
    type: 'stack',
    name: 'Root',
    parentId: null,
    props: {},
    children: [],
    style: {
      direction: 'vertical',
      align: 'stretch',
      justify: 'start',
      gap: 8,
      padding: { top: 48, right: 20, bottom: 24, left: 20 },
      width: { mode: 'fill' },
      height: { mode: 'fill' },
      fill: { light: '#FFFFFF', dark: '#000000' },
    },
  };
  doc.nodes[rootId] = root;
  doc.screens[screenId] = { id: screenId, name, rootId };
  doc.screenOrder.push(screenId);
  return screenId;
}

export function renameScreen(doc: Doc, screenId: ScreenId, name: string): void {
  const s = requireScreen(doc, screenId);
  s.name = name;
}

export function removeScreen(doc: Doc, screenId: ScreenId): void {
  const screen = requireScreen(doc, screenId);
  if (doc.screenOrder.length <= 1) throw new OpError('cannot remove the last screen');

  // Delete every node reachable from the root.
  const toDelete: NodeId[] = [];
  walkSubtree(doc, screen.rootId, (n) => toDelete.push(n.id));
  for (const id of toDelete) delete doc.nodes[id];

  delete doc.screens[screenId];
  const i = doc.screenOrder.indexOf(screenId);
  if (i >= 0) doc.screenOrder.splice(i, 1);

  // Any button that pointed at this screen falls back to 'none'. Callers that
  // want to confirm should check `findButtonsReferencing` before calling.
  for (const n of Object.values(doc.nodes)) {
    if (n.type === 'button' && n.props.action.type === 'navigate' && n.props.action.screenId === screenId) {
      n.props.action = { type: 'none' };
    }
  }
}

export function reorderScreens(doc: Doc, fromIndex: number, toIndex: number): void {
  const n = doc.screenOrder.length;
  if (fromIndex < 0 || fromIndex >= n) throw new OpError(`fromIndex out of range`);
  if (toIndex < 0 || toIndex >= n) throw new OpError(`toIndex out of range`);
  const [id] = doc.screenOrder.splice(fromIndex, 1);
  // After splicing, if moving later we insert at the shifted position.
  if (id) doc.screenOrder.splice(toIndex, 0, id);
}

/** Returns the ids of all buttons whose `navigate` action points at the screen. */
export function findButtonsReferencing(doc: Doc, screenId: ScreenId): NodeId[] {
  const out: NodeId[] = [];
  for (const n of Object.values(doc.nodes)) {
    if (n.type === 'button' && n.props.action.type === 'navigate' && n.props.action.screenId === screenId) {
      out.push(n.id);
    }
  }
  return out;
}

// ---------- Internals --------------------------------------------------------

function clampInsertIndex(idx: number | undefined, len: number): number {
  if (idx === undefined) return len;
  if (idx < 0) return 0;
  if (idx > len) return len;
  return idx;
}

function walkSubtree(doc: Doc, rootId: NodeId, visit: (n: Node) => void): void {
  const stack: NodeId[] = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    const n = doc.nodes[id];
    if (!n) continue;
    visit(n);
    if (isStack(n)) stack.push(...n.children);
  }
}

/**
 * Deep-clone a subtree. The returned Node is NOT yet attached to the doc; its
 * `parentId` is set to `newParentId` (null means "unattached") and all
 * descendants are inserted into `extras` to be committed by `insertNode`.
 */
function cloneSubtree(
  doc: Doc,
  srcId: NodeId,
  newParentId: NodeId | null,
  idMap: Map<NodeId, NodeId>,
  extras: Record<NodeId, Node>,
): Node {
  const src = requireNode(doc, srcId);
  const newId = newNodeId();
  idMap.set(srcId, newId);

  // Structured deep clone of style/props. Fast and dependency-free.
  const styleCopy = structuredClone(src.style);

  if (isStack(src)) {
    const copy: StackNode = {
      id: newId,
      type: 'stack',
      name: src.name,
      parentId: newParentId,
      style: styleCopy,
      props: {},
      children: [],
    };
    for (const childId of src.children) {
      const childClone = cloneSubtree(doc, childId, newId, idMap, extras);
      extras[childClone.id] = childClone;
      copy.children.push(childClone.id);
    }
    return copy;
  }

  // Non-stack: shallow-clone props by value.
  const propsCopy = structuredClone(src.props);
  const n: Node = {
    ...src,
    id: newId,
    parentId: newParentId,
    style: styleCopy,
    props: propsCopy,
  } as Node;
  return n;
}
