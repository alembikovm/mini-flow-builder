import { useDraggable } from '@dnd-kit/core';
import styles from './ElementsPalette.module.css';
import { useEditor } from '../../app/store';
import type { NodeType } from '../../core/model';
import { isStack } from '../../core/model';

const ITEMS: { type: NodeType; label: string }[] = [
  { type: 'stack', label: 'Stack' },
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'button', label: 'Button' },
  { type: 'options', label: 'Options' },
  { type: 'spacer', label: 'Spacer' },
];

function PaletteItem({ type, label }: { type: NodeType; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { kind: 'palette', nodeType: type },
  });
  const addNode = useEditor((s) => s.addNode);
  const selectNode = useEditor((s) => s.selectNode);
  const resolveTargetStack = useEditor((s) => {
    const sel = s.selectedNodeId ? s.history.doc.nodes[s.selectedNodeId] : null;
    if (sel && isStack(sel)) return sel.id;
    if (sel?.parentId) return sel.parentId;
    return s.history.doc.screens[s.currentScreenId]?.rootId ?? null;
  });

  const onClick = (): void => {
    const target = resolveTargetStack;
    if (!target) return;
    const id = addNode(type, target);
    selectNode(id);
  };

  return (
    <button
      ref={setNodeRef}
      className={`${styles.item} ${isDragging ? styles.dragGhost : ''}`}
      {...listeners}
      {...attributes}
      onClick={onClick}
      title={`Add ${label}`}
    >
      <span className={styles.icon}>{label.charAt(0)}</span>
      <span>{label}</span>
    </button>
  );
}

export function ElementsPalette() {
  return (
    <div className={styles.grid}>
      {ITEMS.map((it) => (
        <PaletteItem key={it.type} type={it.type} label={it.label} />
      ))}
    </div>
  );
}
