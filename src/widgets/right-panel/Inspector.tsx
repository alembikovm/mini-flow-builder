import styles from './Inspector.module.css';
import { useEditor } from '../../app/store';

export function Inspector() {
  const selected = useEditor((s) =>
    s.selectedNodeId ? s.history.doc.nodes[s.selectedNodeId] ?? null : null,
  );
  const header = selected ? `${capitalize(selected.type)} — ${selected.name}` : 'Screen settings';
  return (
    <aside className={styles.panel}>
      <div className={styles.header}>{header}</div>
      <div className={styles.body}>
        <p className={styles.placeholder}>Inspector controls — coming in M4.</p>
      </div>
    </aside>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
