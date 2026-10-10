import styles from './TopBar.module.css';
import { useEditor } from '../../app/store';

export function TopBar() {
  const flowName = useEditor((s) => s.flowName);
  const setFlowName = useEditor((s) => s.setFlowName);
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const canUndo = useEditor((s) => s.history.past.length > 0);
  const canRedo = useEditor((s) => s.history.future.length > 0);
  const preview = useEditor((s) => s.preview);
  const setPreview = useEditor((s) => s.setPreview);
  const showJson = useEditor((s) => s.showJson);
  const setShowJson = useEditor((s) => s.setShowJson);

  return (
    <div className={styles.bar}>
      <strong style={{ fontSize: 13 }}>Mini Flow</strong>
      <input
        className={styles.name}
        value={flowName}
        onChange={(e) => setFlowName(e.target.value)}
        aria-label="Flow name"
      />

      <button
        className={styles.iconBtn}
        onClick={undo}
        disabled={!canUndo}
        title="Undo (⌘Z)"
        aria-label="Undo"
      >
        ↶
      </button>
      <button
        className={styles.iconBtn}
        onClick={redo}
        disabled={!canRedo}
        title="Redo (⇧⌘Z)"
        aria-label="Redo"
      >
        ↷
      </button>

      <div className={styles.spacer} />

      <span className={styles.status}>Changes saved</span>

      <button
        className={`${styles.btn} ${showJson ? styles.toggleOn : ''}`}
        onClick={() => setShowJson(!showJson)}
        title="Show exported JSON"
      >
        &lt;/&gt;
      </button>
      <button
        className={`${styles.btn} ${preview ? styles.toggleOn : ''}`}
        onClick={() => setPreview(!preview)}
      >
        {preview ? 'Exit preview' : 'Preview'}
      </button>
      <button className={`${styles.btn} ${styles.primary}`}>Publish</button>
    </div>
  );
}
