import { Canvas, Inspector, LeftPanel, TopBar } from '../widgets';
import { useShortcuts } from './shortcuts';
import { AppProviders } from './providers';

export function App() {
  useShortcuts();
  return (
    <AppProviders>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <TopBar />
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <LeftPanel />
          <Canvas />
          <Inspector />
        </div>
      </div>
    </AppProviders>
  );
}
