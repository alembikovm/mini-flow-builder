import { useState } from 'react';
import styles from './LeftPanel.module.css';

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
      <div className={styles.body}>
        <p className={styles.placeholder}>
          {tab === 'elements' ? 'Elements palette — coming in M5.' : 'Layers tree — coming in M5.'}
        </p>
      </div>
    </aside>
  );
}
