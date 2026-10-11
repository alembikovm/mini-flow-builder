# Mini Flow Builder

A small, architecturally-honest clone of a no-code flow builder: canvas +
phone frame in the middle, element palette on the left, inspector on the
right. Build multi-screen onboarding / quiz / paywall-style flows and export
them as JSON. No SDK, no backend, no payments.

Built as an interview project, so **every non-trivial decision is written
down**. See [`docs/decisions.md`](docs/decisions.md) for the short ADR log.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
```

Scripts:

| | |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | type-check + production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint, zero warnings |
| `npm test` | Vitest unit tests (core/) |
| `npm run e2e` | Playwright smoke + perf tests |

The autosave writes to `localStorage` under `mfb:draft:v1`. Clear it to
start from the seed doc.

## Architecture

```
src/
  core/        framework-agnostic; no React, no store, no DOM
    model      Doc / Node (discriminated union) / Style types
    ops        pure mutations (addNode, moveNode, updateStyle, …)
    history    patch-based undo/redo + transactions (immer)
    schema     zod schema + migrate(doc) stub
    serialize  Doc ↔ JSON
    seed       the 3-screen demo flow
  app/         composition root
    store      Zustand store: doc (via history) + non-doc UI state
    providers  DndContext
    shortcuts  keymap
  widgets/     page-level containers (TopBar / LeftPanel / Canvas /
               Inspector / ScreensBar / JsonPanel)
  features/    user-intent slices (add-element, reorder-layers,
               edit-style, autosave, dev-tools)
  entities/    pure renderers: one per node type + SelectionOverlay
  shared/      ui primitives + tokens + leaf lib
```

**Import direction** (enforced by `eslint-plugin-boundaries`):

```
app → widgets → features → entities → shared
                                    ↘ core (anyone may use)
```

Core never imports React or the store. Entities never import the store (the
subscribing wrapper `widgets/canvas/NodeMount` lives in widgets so this
rule stays clean).

## Key decisions (short list)

Full details in [`docs/decisions.md`](docs/decisions.md).

1. **Normalized document model.** Nodes in a flat `Record<NodeId, Node>` map;
   `children: NodeId[]` only on stacks (TS discriminated union). Moving a
   node is two array ops, not a subtree clone.
2. **`Node` is a discriminated union on `type`.** `props` is correlated with
   `type` at compile time; `updateProps<T>()` can't mix shapes. Only
   `StackNode` has `children` — invariant lives in the type system.
3. **Patch-based history.** Every mutation goes through
   `commit(label, recipe)` running `produceWithPatches`. Transactions
   (`beginTransaction` / `commitTransaction`) collapse a scrub drag into one
   undo entry; a `coalesceKey` + 500 ms window merges keystrokes.
4. **Selection overlay OUTSIDE the preview DOM.** Preview renders exactly
   what a native device would. Overlays are a sibling absolute layer that
   reads `[data-node-id]` rects via `getBoundingClientRect` +
   `ResizeObserver`.
5. **Per-node Zustand subscription.** `NodeMount` subscribes to
   `s.history.doc.nodes[id]` for exactly one node. Combined with memo
   isolation (see #6), changing one style doesn't re-render siblings.
6. **Stable module-level `renderChild`.** Non-obvious: an inline
   `renderChild` closure using a self-referencing `<NodeMount>` defeats
   `React.memo` under Vite's react-refresh — the HMR wrapper hands out a
   fresh component type per render, so React re-mounts every child. Hoist
   `renderChild` to module scope and memo engages.

## Perf result (M8)

Dev-only "Stress test" button creates a screen with 500 text nodes.
`e2e/perf.spec.ts` measures NodeMount renders during a single `gap` edit
on the root stack:

```
[perf] NodeMount renders after a single gap edit (500-node screen) = 2
```

(1 real render for the edited root × 2 for `React.StrictMode`.) None of
the 500 children re-render.

## Scope and non-goals

Out of scope: real SDK, backend, auth, payments, AI editor, real-time
collaboration, localization. The last section of
[`docs/decisions.md`](docs/decisions.md) sketches how I'd approach each at
scale.
