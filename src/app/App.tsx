import { Canvas, Inspector, JsonPanel, LeftPanel, TopBar } from '../widgets';
import { useShortcuts } from './shortcuts';
import { AppProviders } from './providers';
import { useAutosave } from '../features/autosave';

export function App() {
  useShortcuts();
  useAutosave();
  return (
    <AppProviders>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <LeftPanel />
          <Canvas />
          <Inspector />
          <JsonPanel />
        </div>
      </div>
    </AppProviders>
  );
}
