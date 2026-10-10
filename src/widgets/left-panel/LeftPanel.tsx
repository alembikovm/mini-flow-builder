import { useState } from 'react';
import styles from './LeftPanel.module.css';
import { ElementsPalette } from '../../features/add-element';
import { LayersTree } from '../../features/reorder-layers';

type Tab = 'elements' | 'layers';

export function LeftPanel() {
  const [tab, setTab] = useState<Tab>('elements');
  return (
    <aside className={styles.panel}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'elements' ? styles.active : ''}`}
          onClick={() => setTab('elements')}
        >
          Elements
        </button>
        <button
          className={`${styles.tab} ${tab === 'layers' ? styles.active : ''}`}
          onClick={() => setTab('layers')}
        >
          Layers
        </button>
      </div>
      <div className={styles.body}>{tab === 'elements' ? <ElementsPalette /> : <LayersTree />}</div>
    </aside>
  );
}
