// Patch-based undo/redo on top of immer. The module is pure functional: every
// operation takes a `HistoryState<T>` and returns a new one. All timing (for
// coalescing text input) is injected via `options.now` so tests are
// deterministic and the UI can pass `Date.now()`.

import { applyPatches, enablePatches, produceWithPatches, type Draft, type Patch } from 'immer';

enablePatches();

const DEFAULT_LIMIT = 100;
const COALESCE_WINDOW_MS = 500;

export type HistoryEntry = {
  label: string;
  patches: Patch[];
  inversePatches: Patch[];
};

type Transaction = {
  label: string;
  patches: Patch[];
  inversePatches: Patch[];
};

export type HistoryState<T> = {
  doc: T;
  past: HistoryEntry[];
  future: HistoryEntry[];
  pendingTx: Transaction | null;
  lastCommit: { key: string; at: number } | null;
};

export type Recipe<T> = (draft: Draft<T>) => void;

export type CommitOptions = {
  /**
   * Two consecutive commits with the same key within COALESCE_WINDOW_MS merge
   * into a single history entry. Used for text-field typing so that each
   * keystroke doesn't become its own undo step.
   */
  coalesceKey?: string;
  /** Injected for test determinism. Defaults to `Date.now()`. */
  now?: number;
};

export function initHistory<T>(doc: T): HistoryState<T> {
  return { doc, past: [], future: [], pendingTx: null, lastCommit: null };
}

export function commit<T>(
  state: HistoryState<T>,
  label: string,
  recipe: Recipe<T>,
  options: CommitOptions = {},
): HistoryState<T> {
  // Wrap the recipe so any accidental return value from the caller
  // (e.g. `addNode` returns the new id) is discarded. immer errors if a
  // producer both mutates a draft AND returns a non-undefined value.
  const [nextDoc, patches, inversePatches] = produceWithPatches(state.doc, (draft) => {
    recipe(draft);
  });
  if (patches.length === 0) return state;

  // Inside a transaction: accumulate patches, don't touch past/future.
  if (state.pendingTx) {
    return {
      ...state,
      doc: nextDoc,
      pendingTx: {
        ...state.pendingTx,
        patches: [...state.pendingTx.patches, ...patches],
        // Newer inverses go FIRST in the inverse array so that applying the
        // whole array in order rewinds in reverse chronological order.
        inversePatches: [...inversePatches, ...state.pendingTx.inversePatches],
      },
    };
  }

  const now = options.now ?? Date.now();
  const shouldCoalesce =
    options.coalesceKey !== undefined &&
    state.lastCommit !== null &&
    state.lastCommit.key === options.coalesceKey &&
    now - state.lastCommit.at < COALESCE_WINDOW_MS &&
    state.past.length > 0;

  let past: HistoryEntry[];
  if (shouldCoalesce) {
    const last = state.past[state.past.length - 1]!;
    past = [
      ...state.past.slice(0, -1),
      {
        label,
        patches: [...last.patches, ...patches],
        inversePatches: [...inversePatches, ...last.inversePatches],
      },
    ];
  } else {
    past = [...state.past, { label, patches, inversePatches }];
    if (past.length > DEFAULT_LIMIT) past = past.slice(past.length - DEFAULT_LIMIT);
  }

  return {
    ...state,
    doc: nextDoc,
    past,
    future: [],
    lastCommit: options.coalesceKey !== undefined ? { key: options.coalesceKey, at: now } : null,
  };
}

export function beginTransaction<T>(state: HistoryState<T>, label: string): HistoryState<T> {
  if (state.pendingTx) throw new Error('transaction already active');
  return {
    ...state,
    pendingTx: { label, patches: [], inversePatches: [] },
    lastCommit: null,
  };
}

export function commitTransaction<T>(state: HistoryState<T>): HistoryState<T> {
  const tx = state.pendingTx;
  if (!tx) throw new Error('no active transaction');
  if (tx.patches.length === 0) {
    return { ...state, pendingTx: null };
  }
  let past = [...state.past, { label: tx.label, patches: tx.patches, inversePatches: tx.inversePatches }];
  if (past.length > DEFAULT_LIMIT) past = past.slice(past.length - DEFAULT_LIMIT);
  return { ...state, pendingTx: null, past, future: [], lastCommit: null };
}

export function cancelTransaction<T>(state: HistoryState<T>): HistoryState<T> {
  const tx = state.pendingTx;
  if (!tx) throw new Error('no active transaction');
  return {
    ...state,
    doc: applyPatches(state.doc as object, tx.inversePatches) as T,
    pendingTx: null,
  };
}

export function undo<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.pendingTx) throw new Error('cannot undo mid-transaction');
  if (state.past.length === 0) return state;
  const entry = state.past[state.past.length - 1]!;
  return {
    ...state,
    doc: applyPatches(state.doc as object, entry.inversePatches) as T,
    past: state.past.slice(0, -1),
    future: [...state.future, entry],
    lastCommit: null,
  };
}

export function redo<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.pendingTx) throw new Error('cannot redo mid-transaction');
  if (state.future.length === 0) return state;
  const entry = state.future[state.future.length - 1]!;
  return {
    ...state,
    doc: applyPatches(state.doc as object, entry.patches) as T,
    future: state.future.slice(0, -1),
    past: [...state.past, entry],
    lastCommit: null,
  };
}

export const canUndo = <T>(s: HistoryState<T>): boolean => s.past.length > 0;
export const canRedo = <T>(s: HistoryState<T>): boolean => s.future.length > 0;
