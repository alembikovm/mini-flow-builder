// Debounced autosave to localStorage. Subscribes to the Zustand store once
// and writes whenever the doc reference or flow name changes. The subscribe
// callback runs even when no component uses the slice.

import { useEffect, useRef } from 'react';
import { useEditor, LS_DRAFT_KEY } from '../../app/store';
import { debounce } from '../../shared/lib';

const DEBOUNCE_MS = 800;

export function useAutosave(): void {
  // We debounce the write but mark 'saving' immediately on any change so the
  // top bar reflects the user's intent even before the write hits storage.
  const lastWrittenRef = useRef<unknown>(null);

  useEffect(() => {
    const _setSaveStatus = useEditor.getState()._setSaveStatus;

    const write = debounce(() => {
      const { history, flowName } = useEditor.getState();
      try {
        const payload = JSON.stringify({ doc: history.doc, flowName });
        localStorage.setItem(LS_DRAFT_KEY, payload);
        lastWrittenRef.current = history.doc;
        _setSaveStatus('saved');
      } catch {
        _setSaveStatus('error');
      }
    }, DEBOUNCE_MS);

    const unsub = useEditor.subscribe((state, prev) => {
      const docChanged = state.history.doc !== prev.history.doc;
      const nameChanged = state.flowName !== prev.flowName;
      if (!docChanged && !nameChanged) return;
      _setSaveStatus('saving');
      write();
    });

    return () => {
      unsub();
      write.flush();
    };
  }, []);
}
