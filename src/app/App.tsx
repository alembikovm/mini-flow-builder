import { Canvas, Inspector, LeftPanel, TopBar } from '../widgets';
import { useShortcuts } from './shortcuts';

export function App() {
  useShortcuts();
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
