
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
  coalesceKey?: string;
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
  const [nextDoc, patches, inversePatches] = produceWithPatches(state.doc, (draft) => {
    recipe(draft);
  });
  if (patches.length === 0) return state;

  if (state.pendingTx) {
    return {
      ...state,
      doc: nextDoc,
      pendingTx: {
        ...state.pendingTx,
        patches: [...state.pendingTx.patches, ...patches],
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
