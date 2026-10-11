
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
import { safeParseDoc } from '../core/schema';
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

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type PublishedVersion = {
  version: number;
  publishedAt: string;
  doc: Doc;
};

export type JsonView = 'draft' | 'published';

const LS_KEY = 'mfb:draft:v1';
const LS_PUBLISHED_KEY = 'mfb:published:v1';
const LS_FLOW_NAME_KEY = 'mfb:flowName:v1';

type SavedShape = { doc: Doc; flowName: string };

function loadSaved(): SavedShape | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { doc?: unknown; flowName?: unknown };
    if (!parsed || typeof parsed !== 'object' || !parsed.doc) return null;
    const result = safeParseDoc(parsed.doc);
    if (!result.ok) return null;
    return {
      doc: result.doc,
      flowName: typeof parsed.flowName === 'string' ? parsed.flowName : 'Untitled flow',
    };
  } catch {
    return null;
  }
}

function loadPublished(): PublishedVersion[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(LS_PUBLISHED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: PublishedVersion[] = [];
    for (const v of parsed) {
      if (!v || typeof v !== 'object') continue;
      const r = safeParseDoc((v as { doc?: unknown }).doc);
      if (!r.ok) continue;
      const ver = (v as { version?: unknown }).version;
      const at = (v as { publishedAt?: unknown }).publishedAt;
      if (typeof ver !== 'number' || typeof at !== 'string') continue;
      out.push({ version: ver, publishedAt: at, doc: r.doc });
    }
    return out;
  } catch {
    return [];
  }
}

export type EditorState = {
  history: HistoryState<Doc>;

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

  saveStatus: SaveStatus;
  publishedVersions: PublishedVersion[];
  jsonView: JsonView;

  publish: () => void;
  setJsonView: (v: JsonView) => void;
  _setSaveStatus: (s: SaveStatus) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  beginTx: (label: string) => void;
  commitTx: () => void;
  cancelTx: () => void;

  commit: (label: string, recipe: (draft: Draft<Doc>) => void, coalesceKey?: string) => void;

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

  addScreen: (name?: string) => ScreenId;
  renameScreen: (id: ScreenId, name: string) => void;
  removeScreen: (id: ScreenId) => void;
  reorderScreens: (from: number, to: number) => void;
  setCurrentScreen: (id: ScreenId) => void;

  selectNode: (id: NodeId | null) => void;
  selectParent: () => void;
  setHover: (id: NodeId | null) => void;

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
  | 'saveStatus'
  | 'publishedVersions'
  | 'jsonView'
> {
  const saved = loadSaved();
  const doc = saved?.doc ?? createSeedDoc();
  return {
    history: initHistory(doc),
    flowName: saved?.flowName ?? 'Untitled flow',
    currentScreenId: doc.screenOrder[0]!,
    selectedNodeId: null,
    hoveredNodeId: null,
    preview: false,
    previewReturnScreenId: null,
    showJson: false,
    device: 'iphone',
    orientation: 'portrait',
    theme: 'light',
    saveStatus: saved ? 'saved' : 'idle',
    publishedVersions: loadPublished(),
    jsonView: 'draft',
  };
}

export const useEditor = create<EditorState>()((set, get) => {
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

    // ------- publish / save ------------------------------------------------
    publish: () => {
      const { history, publishedVersions } = get();
      const nextVersion = (publishedVersions[publishedVersions.length - 1]?.version ?? 0) + 1;
      const snapshot: PublishedVersion = {
        version: nextVersion,
        publishedAt: new Date().toISOString(),
        doc: structuredClone(history.doc),
      };
      const nextList = [...publishedVersions, snapshot];
      set({ publishedVersions: nextList });
      try {
        localStorage.setItem(LS_PUBLISHED_KEY, JSON.stringify(nextList));
      } catch {
        /* storage quota / privacy mode — ignore, in-memory list still works */
      }
    },

    setJsonView: (v) => set({ jsonView: v }),
    _setSaveStatus: (s) => set({ saveStatus: s }),
  };
});

export const LS_DRAFT_KEY = LS_KEY;
export const LS_FLOW_NAME_STORAGE_KEY = LS_FLOW_NAME_KEY;

// Selectors kept here so components don't accidentally subscribe to the whole
// store object. Each returns a primitive or a stable reference.
export const selectDoc = (s: EditorState): Doc => s.history.doc;
export const selectCurrentScreen = (s: EditorState) => s.history.doc.screens[s.currentScreenId];
export const selectNode = (id: NodeId) => (s: EditorState) => s.history.doc.nodes[id];
export const selectButtonsReferencingScreen =
  (screenId: ScreenId) =>
  (s: EditorState): NodeId[] =>
    findButtonsReferencing(s.history.doc, screenId);
