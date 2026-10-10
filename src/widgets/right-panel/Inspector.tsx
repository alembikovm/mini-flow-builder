import styles from './Inspector.module.css';
import { useEditor } from '../../app/store';
import { StackInspector } from './panels/StackInspector';
import { TextInspector } from './panels/TextInspector';
import { ImageInspector } from './panels/ImageInspector';
import { ButtonInspector } from './panels/ButtonInspector';
import { OptionsInspector } from './panels/OptionsInspector';
import { SpacerInspector } from './panels/SpacerInspector';
import { ScreenSettings } from './panels/ScreenSettings';

export function Inspector() {
  const node = useEditor((s) =>
    s.selectedNodeId ? s.history.doc.nodes[s.selectedNodeId] ?? null : null,
  );
  const header = node ? `${capitalize(node.type)} — ${node.name}` : 'Screen';

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>{header}</div>
      <div className={styles.body}>
        {node === null ? (
          <ScreenSettings />
        ) : node.type === 'stack' ? (
          <StackInspector node={node} />
        ) : node.type === 'text' ? (
          <TextInspector node={node} />
        ) : node.type === 'image' ? (
          <ImageInspector node={node} />
        ) : node.type === 'button' ? (
          <ButtonInspector node={node} />
        ) : node.type === 'options' ? (
          <OptionsInspector node={node} />
        ) : (
          <SpacerInspector node={node} />
        )}
      </div>
    </aside>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
