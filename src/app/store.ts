// Zustand store. Owns the authoritative document (via history) and all
// ephemeral UI state that is NOT part of history (selection, hover, preview,
// current screen, JSON panel toggle, flow name).
//
// Mutations go through `commit` so every change produces a patch + inverse
// pair; undo/redo flip between past/future stacks.
//
// Convenience actions (addNode, updateStyle, duplicate, ...) are thin wrappers
// around `commit` with a stable `label` and, where it matters, a `coalesceKey`
// so e.g. consecutive keystrokes merge into one undo step.

import { create } from 'zustand';
import type { Draft } from 'immer';
import {
  addNode as opsAddNode,
  addScreen as opsAddScreen,
  duplicateNode as opsDuplicateNode,
  findButtonsReferencing,
  moveNode as opsMoveNode,
  removeNode as opsRemoveNode,
  removeScreen as opsRemoveScreen,
  renameNode as opsRenameNode,
  renameScreen as opsRenameScreen,
  reorderScreens as opsReorderScreens,
  updateProps as opsUpdateProps,
  updateStyle as opsUpdateStyle,
} from '../core/ops';
import type { Doc, NodeId, NodeStyle, NodeType, PropsOfType, ScreenId } from '../core/model';
import { createSeedDoc } from '../core/seed';
import {
  beginTransaction,
  canRedo,
  canUndo,
  cancelTransaction,
  commit,
  commitTransaction,
  initHistory,
  redo,
  undo,
  type HistoryState,
} from '../core/history';

export type DeviceId = 'iphone' | 'iphoneSE' | 'android';
export type Orientation = 'portrait' | 'landscape';
export type Theme = 'light' | 'dark';

export type EditorState = {
  // Doc + history
  history: HistoryState<Doc>;

  // UI state (not in history)
  flowName: string;
  currentScreenId: ScreenId;
  selectedNodeId: NodeId | null;
  hoveredNodeId: NodeId | null;
  preview: boolean;
  previewReturnScreenId: ScreenId | null;
  showJson: boolean;
  device: DeviceId;
  orientation: Orientation;
  theme: Theme;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Transactions
  beginTx: (label: string) => void;
  commitTx: () => void;
  cancelTx: () => void;

  // Low-level commit for ad-hoc recipes.
  commit: (label: string, recipe: (draft: Draft<Doc>) => void, coalesceKey?: string) => void;

  // Node ops
  addNode: (type: NodeType, parentId: NodeId, index?: number) => NodeId;
  removeNode: (id: NodeId) => void;
  moveNode: (id: NodeId, parentId: NodeId, index: number) => void;
  duplicateNode: (id: NodeId) => NodeId;
  renameNode: (id: NodeId, name: string, coalesceKey?: string) => void;
  updateStyle: (id: NodeId, patch: Partial<NodeStyle>, coalesceKey?: string) => void;
  updateProps: <T extends NodeType>(
    id: NodeId,
    type: T,
    patch: Partial<PropsOfType<T>>,
    coalesceKey?: string,
  ) => void;

  // Screen ops
  addScreen: (name?: string) => ScreenId;
  renameScreen: (id: ScreenId, name: string) => void;
  removeScreen: (id: ScreenId) => void;
  reorderScreens: (from: number, to: number) => void;
  setCurrentScreen: (id: ScreenId) => void;

  // Selection / hover
  selectNode: (id: NodeId | null) => void;
  selectParent: () => void;
  setHover: (id: NodeId | null) => void;

  // Misc UI
  setFlowName: (name: string) => void;
  setPreview: (on: boolean) => void;
  setShowJson: (on: boolean) => void;
  setDevice: (d: DeviceId) => void;
  setOrientation: (o: Orientation) => void;
  setTheme: (t: Theme) => void;
};

function initialState(): Pick<
  EditorState,
  | 'history'
  | 'flowName'
  | 'currentScreenId'
  | 'selectedNodeId'
  | 'hoveredNodeId'
  | 'preview'
  | 'previewReturnScreenId'
  | 'showJson'
  | 'device'
  | 'orientation'
  | 'theme'
> {
  const doc = createSeedDoc();
  return {
    history: initHistory(doc),
    flowName: 'Untitled flow',
    currentScreenId: doc.screenOrder[0]!,
    selectedNodeId: null,
    hoveredNodeId: null,
    preview: false,
    previewReturnScreenId: null,
    showJson: false,
    device: 'iphone',
    orientation: 'portrait',
    theme: 'light',
  };
}

export const useEditor = create<EditorState>()((set, get) => {
  // After any history change that may have deleted the current selection or
  // screen, repair the UI state so we never dangle on a missing id.
  const repairAfterHistoryChange = (): void => {
    const { history, selectedNodeId, currentScreenId } = get();
    const patch: Partial<EditorState> = {};
    if (selectedNodeId !== null && !history.doc.nodes[selectedNodeId]) {
      patch.selectedNodeId = null;
    }
    if (!history.doc.screens[currentScreenId]) {
      patch.currentScreenId = history.doc.screenOrder[0] ?? '';
    }
    if (Object.keys(patch).length > 0) set(patch);
  };

  return {
    ...initialState(),

    // ------- history ------------------------------------------------------
    undo: () => {
      set({ history: undo(get().history) });
      repairAfterHistoryChange();
    },
    redo: () => {
      set({ history: redo(get().history) });
      repairAfterHistoryChange();
    },
    canUndo: () => canUndo(get().history),
    canRedo: () => canRedo(get().history),

    beginTx: (label) => set({ history: beginTransaction(get().history, label) }),
    commitTx: () => set({ history: commitTransaction(get().history) }),
    cancelTx: () => {
      set({ history: cancelTransaction(get().history) });
      repairAfterHistoryChange();
    },

    commit: (label, recipe, coalesceKey) => {
      set({
        history: commit(get().history, label, recipe, coalesceKey ? { coalesceKey } : {}),
      });
    },

    // ------- node ops -----------------------------------------------------
    addNode: (type, parentId, index) => {
      let newId = '';
      set({
        history: commit(get().history, `add ${type}`, (d) => {
          newId = opsAddNode(d, type, index === undefined ? { parentId } : { parentId, index });
        }),
      });
      return newId;
    },

    removeNode: (id) => {
      set({ history: commit(get().history, 'remove', (d) => opsRemoveNode(d, id)) });
      repairAfterHistoryChange();
    },

    moveNode: (id, parentId, index) => {
      set({
        history: commit(get().history, 'move', (d) => opsMoveNode(d, id, { parentId, index })),
      });
    },

    duplicateNode: (id) => {
      let newId = '';
      set({
        history: commit(get().history, 'duplicate', (d) => {
          newId = opsDuplicateNode(d, id);
        }),
      });
      return newId;
    },

    renameNode: (id, name, coalesceKey) => {
      set({
        history: commit(
          get().history,
          'rename',
          (d) => opsRenameNode(d, id, name),
          coalesceKey ? { coalesceKey } : {},
        ),
      });
    },

    updateStyle: (id, patch, coalesceKey) => {
      set({
        history: commit(
          get().history,
          'style',
          (d) => opsUpdateStyle(d, id, patch),
          coalesceKey ? { coalesceKey } : {},
        ),
      });
    },

    updateProps: (id, type, patch, coalesceKey) => {
      set({
        history: commit(
          get().history,
          'props',
          (d) => opsUpdateProps(d, id, type, patch),
          coalesceKey ? { coalesceKey } : {},
        ),
      });
    },

    // ------- screens ------------------------------------------------------
    addScreen: (name) => {
      let newId = '';
      set({
        history: commit(get().history, 'add screen', (d) => {
          newId = opsAddScreen(d, name);
        }),
      });
      set({ currentScreenId: newId });
      return newId;
    },

    renameScreen: (id, name) => {
      set({ history: commit(get().history, 'rename screen', (d) => opsRenameScreen(d, id, name)) });
    },

    removeScreen: (id) => {
      set({ history: commit(get().history, 'remove screen', (d) => opsRemoveScreen(d, id)) });
      repairAfterHistoryChange();
    },

    reorderScreens: (from, to) => {
      set({
        history: commit(get().history, 'reorder screens', (d) => opsReorderScreens(d, from, to)),
      });
    },

    setCurrentScreen: (id) => {
      set({ currentScreenId: id, selectedNodeId: null, hoveredNodeId: null });
    },

    // ------- selection / hover -------------------------------------------
    selectNode: (id) => set({ selectedNodeId: id }),
    selectParent: () => {
      const { selectedNodeId, history } = get();
      if (!selectedNodeId) return;
      const n = history.doc.nodes[selectedNodeId];
      if (!n) return;
      if (n.parentId) set({ selectedNodeId: n.parentId });
    },
    setHover: (id) => set({ hoveredNodeId: id }),

    // ------- misc UI ------------------------------------------------------
    setFlowName: (name) => set({ flowName: name }),
    setPreview: (on) => {
      const state = get();
      if (on) {
        set({
          preview: true,
          previewReturnScreenId: state.currentScreenId,
          selectedNodeId: null,
          hoveredNodeId: null,
        });
      } else {
        const target = state.previewReturnScreenId;
        set({
          preview: false,
          previewReturnScreenId: null,
          selectedNodeId: null,
          hoveredNodeId: null,
          ...(target && state.history.doc.screens[target]
            ? { currentScreenId: target }
            : {}),
        });
      }
    },
    setShowJson: (on) => set({ showJson: on }),
    setDevice: (d) => set({ device: d }),
    setOrientation: (o) => set({ orientation: o }),
    setTheme: (t) => set({ theme: t }),
  };
});

// Selectors kept here so components don't accidentally subscribe to the whole
// store object. Each returns a primitive or a stable reference.
export const selectDoc = (s: EditorState): Doc => s.history.doc;
export const selectCurrentScreen = (s: EditorState) => s.history.doc.screens[s.currentScreenId];
export const selectNode = (id: NodeId) => (s: EditorState) => s.history.doc.nodes[id];
export const selectButtonsReferencingScreen =
  (screenId: ScreenId) =>
  (s: EditorState): NodeId[] =>
    findButtonsReferencing(s.history.doc, screenId);
