import { Canvas, Inspector, LeftPanel, TopBar } from '../widgets';
import { useEditor } from './store';
import { useEffect } from 'react';

export function App() {
  const selectParent = useEditor((s) => s.selectParent);
  const selectNode = useEditor((s) => s.selectNode);

  // Minimal Escape wiring — full keymap lands in M4.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement | null;
        const inInput =
          !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
        if (inInput) return;
        // If something is selected, go to parent; else clear.
        const state = useEditor.getState();
        const n = state.selectedNodeId ? state.history.doc.nodes[state.selectedNodeId] : null;
        if (n?.parentId) selectParent();
        else selectNode(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectParent, selectNode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <LeftPanel />
        <Canvas />
        <Inspector />
      </div>
    </div>
  );
}
