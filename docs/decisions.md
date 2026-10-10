# Design decisions

Short ADR-style log. One entry per non-obvious choice. Each entry: **Context →
Decision → Trade-offs → At scale**.

---

## 1. Normalized document model

**Context.** The editor manipulates a tree of nodes but the UI re-renders every
node on any state change if the tree is nested.

**Decision.** Store nodes in a flat `Record<NodeId, Node>` map keyed by id; the
parent-child relation lives in `parentId` + `children: NodeId[]` (on stacks).
Screens hold only an ordered list of ids.

**Trade-offs.**
- + Moving / inserting / renaming a node touches at most two arrays and one
  object; no subtree cloning.
- + Each rendered node subscribes to `state.doc.nodes[id]` only, so a style
  change on one node doesn't re-render siblings or ancestors.
- + Serialization is trivial — the shape is already serializable.
- − Tree traversal is one indirection per hop (`doc.nodes[childId]`) rather
  than direct property access. Negligible for < 10⁴ nodes.
- − Invariants that would be free in a nested tree (every child's `parentId`
  points back to its parent) now have to be preserved by `ops.ts`. Covered by
  tests.

**At scale.** The same shape maps directly to a CRDT: nodes become a map of
LWW-registers (for props/style) + an RGA/Yjs list (for `children`). The
normalization is the thing that makes Yjs integration realistic later.

---

## 2. Discriminated-union `Node`

**Context.** Only `stack` nodes have children, and each node type carries
different `props`.

**Decision.** `Node` is a TS discriminated union keyed on `type`. `StackNode`
is the only variant with a `children: NodeId[]` field. Props are correlated
with type at compile time (`updateProps<T>(doc, id, type, patch)` cannot be
called with the wrong patch shape).

**Trade-offs.**
- + Impossible states are unrepresentable: `{ type: 'text', children: [...] }`
  does not compile.
- + Props mutations are checked at both compile- and runtime.
- − Traversal code has to narrow with `isStack(n)` before touching
  `n.children`. `childrenOf(n)` helper hides this when the caller just needs
  "children or []".

**At scale.** When adding a new node type (e.g. `video`), the TS exhaustiveness
check in `createNode` and all the renderers forces the author to think about
defaults and rendering before shipping — no silent fallthrough.

---

## 3. `SizeValue` as a discriminated union

**Context.** The spec text used `{ mode: 'fill' | 'hug' | 'fixed'; value?: number }`.

**Decision.** Modelled as `{mode: 'fill'} | {mode: 'hug'} | {mode: 'fixed'; value: number}`.

**Trade-offs.**
- + You can't construct `{ mode: 'fill', value: 123 }` or `{ mode: 'fixed' }`
  without a value — the exported JSON always carries exactly what the SDK needs.
- − The inspector has to construct a new object when switching modes rather
  than tweaking a single key. One extra line.

**At scale.** If/when "fit-content with cap" or percent sizes appear, each is
a new variant with its own payload; TS narrowing in the renderer catches
every unhandled case.

---

## Next steps at scale (placeholder — fleshed out in M8)

- **Collaborative editing.** Replace the Zustand doc slice with a Yjs doc of
  shape `{ screens: Y.Map<Y.Map>, nodes: Y.Map<Y.Map>, screenOrder: Y.Array }`.
  Our normalized model maps 1:1. Local ops become Y transactions; history
  becomes `Y.UndoManager` scoped to the current user.
- **Schema migrations.** `schema.ts` versions the document. On load,
  `migrate(doc)` runs numbered migration functions `v1 → v2 → ...`. SDK
  versions pin to a schema range.
- **AI edits.** The LLM proposes an array of ops; we commit them inside a
  single `beginTransaction('AI: <summary>')` so one undo reverts the whole
  change.
- **Visual regression.** A Playwright job renders every screen in the preview
  and diffs against reference screenshots captured by the SDK on a device
  farm — catches cases where our web preview and native render diverge.
