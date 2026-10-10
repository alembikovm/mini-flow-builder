import { useMemo } from 'react';
import styles from './JsonPanel.module.css';
import { useEditor } from '../../app/store';
import { serializeDoc } from '../../core/serialize';
import { SegmentedControl } from '../../shared/ui';

export function JsonPanel() {
  const show = useEditor((s) => s.showJson);
  const view = useEditor((s) => s.jsonView);
  const setJsonView = useEditor((s) => s.setJsonView);
  const draft = useEditor((s) => s.history.doc);
  const published = useEditor((s) => s.publishedVersions);
  const latest = published[published.length - 1];

  const draftJson = useMemo(() => serializeDoc(draft), [draft]);
  const publishedJson = useMemo(() => (latest ? serializeDoc(latest.doc) : ''), [latest]);

  if (!show) return null;

  const diffs = latest ? draftJson !== publishedJson : false;

  const body =
    view === 'draft'
      ? draftJson
      : latest
      ? publishedJson
      : '';

  return (
    <aside className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.title}>Exported config</span>
        {diffs && <span className={styles.diff}>Draft differs from v{latest?.version}</span>}
        <div className={styles.spacer} />
        <SegmentedControl
          value={view}
          options={[
            { value: 'draft' as const, label: 'Draft' },
            {
              value: 'published' as const,
              label: latest ? `v${latest.version}` : 'Published',
            },
          ]}
          onChange={setJsonView}
        />
      </div>
      {view === 'published' && !latest ? (
        <div className={styles.empty}>No published version yet. Hit "Publish" to snapshot the current draft.</div>
      ) : (
        <pre className={styles.pre}>{body}</pre>
      )}
    </aside>
  );
}
