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

## 4. Patch-based history + explicit transactions

**Context.** The editor needs undo/redo that groups a slider drag or a color
pick as a single step, and that coalesces consecutive text input.

**Decision.** Each mutation goes through `commit(label, recipe)` which runs
`immer.produceWithPatches` and pushes `{patches, inversePatches, label}` onto
`past`. `beginTransaction(label)` / `commitTransaction()` accumulate patches
into one entry so a 50-step drag is one undo. `coalesceKey` + a 500 ms window
merges keystrokes.

**Trade-offs.**
- + Patches are tiny (just the diff) and serializable, so history can be sent
  over the wire if we ever add collab or a time-travel debugger.
- + Transactions and coalescing share the same primitive — no second history
  path to debug.
- + Pure functional (no mutable manager class), so tests pass `now` and
  prod uses `Date.now()`.
- − immer errors if a recipe both mutates and returns a value. `commit` wraps
  the recipe in a `(d) => { recipe(d); }` to swallow return values from
  helpers like `addNode` (which returns the new id).
- − Patches reference paths by key. Deleting a node and re-adding it with a
  different id breaks a stored patch chain — fine for in-session undo, not
  for persisted redo across sessions. We don't persist history.

**At scale.** Replace the stacks with `Y.UndoManager` scoped to the current
user. Each user has their own stacks; a remote user's edits don't appear in
your undo. Transactions become Y transactions. Everything else — the recipe
API, the coalesce key, the transaction wrapping — stays identical.

---

## 5. Separate HistoryManager vs. Zustand state

**Context.** Should history live inside the Zustand store or next to it?

**Decision.** The whole `HistoryState<Doc>` is a field on the Zustand state.
Mutations go `set({ history: commit(get().history, ...) })`. Non-doc UI state
(selection, hover, current screen, preview, device, theme) lives as siblings
on the same store and is explicitly NOT in history.

**Trade-offs.**
- + One source of truth for subscribers. Components that need the doc read
  `history.doc` through a selector.
- + Selection repair after undo/redo is a 3-line helper that runs after any
  action that could delete a node (`undo`, `redo`, `removeNode`, …).
- − `set({ history: ... })` means every history mutation returns a new
  `HistoryState` object, which is fine because Zustand uses shallow equality
  and selectors like `s => s.history.doc` reach for a stable sub-reference.

---

## 6. Overlay OUTSIDE the preview DOM

**Context.** We want hover + selection outlines in the editor, but the preview
should match pixel-for-pixel what the native SDK renders.

**Decision.** Rendered DOM nodes carry `data-node-id` and have zero
editor-specific styling. The `SelectionOverlay` is a sibling, absolute-
positioned layer that queries rects via `getBoundingClientRect` relative to a
`stageRef`, listens for size changes via `ResizeObserver`, and recomputes when
the doc revision bumps.

**Trade-offs.**
- + Toggling preview mode has no visual effect on the preview; we just hide
  the overlay. Comparing "editor preview" to "device screenshot" is a
  one-pixel diff.
- + No React re-render of the preview tree when the hover id changes — the
  overlay owns that state and re-renders only itself.
- − Rects can go stale if layout changes without a size change on the stage
  (e.g. a font loads late). The `revision` number from history catches
  every doc-induced change; `ResizeObserver` catches ambient layout.
- − Precision depends on `getBoundingClientRect`. In the current scope that's
  fine; a stress test with transforms would need more care.

---

## 7. Per-node Zustand subscription via `NodeMount`

**Context.** React.memo on a renderer that takes `doc` as a prop still re-
renders siblings on every edit because the top-level `doc` reference changes.

**Decision.** `entities/node/*` renderers are pure (take a resolved `node` and
a `renderChild(id, direction)` callback). `widgets/canvas/NodeMount`
subscribes to `useEditor(s => s.history.doc.nodes[id])` for exactly one node,
then recurses by rendering a new `NodeMount` for each child id. When a
mutation touches node X, only `NodeMount(X)` re-renders — its siblings'
subscriptions see the same reference and bail out.

**Trade-offs.**
- + Isolation is automatic — no manual `memo` + comparator; Zustand's shallow
  subscription does the work.
- + The ESLint boundary (`entities` must not import `app`) stays clean: the
  store lives in `app`, the subscription hook is in `widgets`.
- − The `renderChild` callback is a fresh function per render, which means
  React.memo on `NodeRenderer` is defeated. That's fine because the real
  isolation boundary is `NodeMount`; `memo` on the renderer is a leftover
  optimisation that we'll measure (and probably remove) in M8.

---

## 8. Scrub = one transaction, keystroke = coalesced commit

**Context.** A single padding-scrub produces 50 intermediate `updateStyle`
calls. Users expect one undo to revert the whole drag. Typing in a text field
produces one commit per keystroke — users expect undo to revert the whole word
or a reasonable chunk.

**Decision.** Shared `NumberInput` fires `onBeginScrub` / `onEndScrub` around
label-drag. Inspector panels wrap those in `useScrub(label)`, which calls
`beginTx(label)` → every intermediate `updateStyle` accumulates into the
pending transaction → `commitTx()` folds them into one undo entry. For text
inputs the panel passes a `coalesceKey` (`text:<nodeId>:content`) to
`updateProps`; the history coalesces consecutive commits with the same key
within 500 ms.

**Trade-offs.**
- + The scrub implementation is one hook, one begin/end pair; no custom
  "snapshot before/after" dance.
- + Transactions and coalescing use the same history primitives — no second
  code path to maintain.
- − Transactions must be committed. If a React tree unmounts mid-drag
  (unlikely but possible on preview toggle), the transaction is orphaned.
  We mitigate by calling `cancelTx` on effect cleanup; a stricter design
  would auto-close transactions after a pointer-released listener on
  `window`.

---

## 9. Stable module-level `renderChild` for memo isolation

**Context.** With 500 text nodes on screen, editing a single style
(`gap` on the root stack) was triggering **1002 `NodeMount` renders** in
StrictMode (501 unique ids × 2). `React.memo` on NodeMount was NOT engaging
for the 500 unchanged children — memo's compare function was called exactly
once (for the root).

**Diagnosis.** The parent passed a `renderChild` closure that created each
child via `<NodeMount id={childId} .../>`. That closure captured `NodeMount`
from the enclosing module scope. Under `@vitejs/plugin-react` the React Fast
Refresh wrapper handed each render a *different* NodeMount reference,
so React's reconciler saw a different component type per iteration and
re-mounted all children instead of updating them. Memo cannot engage on
initial mount.

**Decision.** Hoist `renderChild` to module scope and split the component
into `NodeMountInner` + `export const NodeMount = memo(NodeMountInner)`. The
`renderChild` arrow now closes over the module-level `NodeMount` export,
which is stable across renders.

**Measurement.** With this change, editing `gap` on the root of a 500-node
screen produces exactly **2 NodeMount renders** (1 for the edited root, ×2
for StrictMode). None of the 500 children re-render. The counter is
instrumented in `src/widgets/canvas/NodeMount.tsx` and exercised in
`e2e/perf.spec.ts`.

**Trade-offs.**
- + Isolation is now per-node — exactly what the spec asked for.
- − Non-obvious failure mode: an inline `renderChild` closure "looks fine"
  but silently defeats memoisation under HMR. Documented inline so a future
  maintainer doesn't reinline it.
- − The dev-only `__mfbRenderCount` on `window` is a hack; a real codebase
  would use the React Profiler API via `<Profiler onRender={...}>` wrapped
  around the preview, dumping to a dev panel.

---

## Next steps at scale

- **Collaborative editing.** Replace the Zustand doc slice with a Yjs doc of
  shape `{ screens: Y.Map<Y.Map>, nodes: Y.Map<Y.Map>, screenOrder: Y.Array }`.
  Our normalized model maps 1:1 — moving a node is still two `Y.Array`
  edits. Local ops become `Y.Transaction`s so remote peers see atomic
  changes; history becomes `Y.UndoManager` scoped to the current user so a
  collaborator's edits don't appear in your undo. The scrub transactions
  from M4 translate directly: `beginTransaction` → open a Y.Transaction,
  `commitTransaction` → close it.
- **Schema migrations.** `schemaVersion` is already in the doc. For v1→v2
  add a function `migrateV1toV2(doc: v1): v2` and chain in
  `migrate(raw)`. Published versions keep their original `schemaVersion`
  so the SDK can pin to a schema range; the editor always migrates to
  current.
- **AI-generated edits.** The LLM returns an array of ops; the editor runs
  them inside one `beginTransaction('AI: <summary>')`. One undo reverts
  the whole proposal. A dry-run panel diffs the resulting doc against
  current before the user accepts.
- **Visual regression.** A nightly Playwright job renders every screen in
  preview and diffs against reference screenshots captured by the SDK on
  a device farm. Catches drift where the web preview and native render
  diverge (fonts, dark-mode blending, safe-area insets).
- **Node types as plugins.** Today `NodeType` is a closed union in
  `model.ts`. For an SDK with many node types, a plugin interface
  `{ type, schema, defaults, renderer, inspector }` registered at init
  lets the SDK team ship new nodes without touching the editor's core.
  The discriminated-union structure stays — it's now generated from
  the plugin registry.
