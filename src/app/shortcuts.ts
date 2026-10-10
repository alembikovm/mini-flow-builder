// Global keyboard shortcuts. Attached once in App via `useShortcuts()`.
// Rules:
//   - If focus is inside an editable element, shortcuts other than undo/redo
//     and Escape are ignored, so typing in a text field never triggers them.
//   - Undo/redo work even inside inputs (standard editor expectation).

import { useEffect } from 'react';
import { useEditor } from './store';

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

function cmdOrCtrl(e: KeyboardEvent): boolean {
  return isMac ? e.metaKey : e.ctrlKey;
}

export function useShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const state = useEditor.getState();
      const editable = isEditable(e.target);

      // Undo / Redo (allowed anywhere)
      if (cmdOrCtrl(e) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) state.redo();
        else state.undo();
        return;
      }
      if (cmdOrCtrl(e) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        state.redo();
        return;
      }

      // Escape: select parent, else clear selection.
      if (e.key === 'Escape') {
        if (editable) return;
        const n = state.selectedNodeId ? state.history.doc.nodes[state.selectedNodeId] : null;
        if (n?.parentId) state.selectParent();
        else state.selectNode(null);
        return;
      }

      if (editable) return;

      // Delete / Backspace: remove selected node (unless it's a screen root).
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const id = state.selectedNodeId;
        if (!id) return;
        const n = state.history.doc.nodes[id];
        if (!n || n.parentId === null) return;
        e.preventDefault();
        state.removeNode(id);
        return;
      }

      // Cmd/Ctrl + D: duplicate selected
      if (cmdOrCtrl(e) && (e.key === 'd' || e.key === 'D')) {
        const id = state.selectedNodeId;
        if (!id) return;
        const n = state.history.doc.nodes[id];
        if (!n || n.parentId === null) return;
        e.preventDefault();
        const newId = state.duplicateNode(id);
        state.selectNode(newId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
