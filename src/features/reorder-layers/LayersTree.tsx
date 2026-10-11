import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import styles from './LayersTree.module.css';
import { useEditor } from '../../app/store';
import { isStack, type NodeId } from '../../core/model';

export function LayersTree() {
  const screen = useEditor((s) => s.history.doc.screens[s.currentScreenId]);
  if (!screen) return <div style={{ color: 'var(--mfb-text-faint)' }}>No screen</div>;
  return (
    <div className={styles.tree}>
      <LayerRow id={screen.rootId} depth={0} />
    </div>
  );
}

type LayerRowProps = { id: NodeId; depth: number };

const LayerRow = memo(function LayerRow({ id, depth }: LayerRowProps) {
  const node = useEditor((s) => s.history.doc.nodes[id]);
  const selected = useEditor((s) => s.selectedNodeId === id);
  const selectNode = useEditor((s) => s.selectNode);
  const renameNode = useEditor((s) => s.renameNode);

  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canDrag = node?.parentId !== null;
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `layer:${id}`,
    data: { kind: 'layer', nodeId: id },
    disabled: !canDrag,
  });

  // Droppable (only stacks)
  const isAStack = node ? isStack(node) : false;
  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `layer-drop:${id}`,
    data: { kind: 'stack-drop', nodeId: id },
    disabled: !isAStack,
  });

  // Combine refs: dnd-kit's setNodeRef expects a single element.
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      setDragRef(el);
      setDropRef(el);
    },
    [setDragRef, setDropRef],
  );

  useEffect(() => {
    if (renaming !== null) inputRef.current?.select();
  }, [renaming]);

  if (!node) return null;

  const toggle = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setExpanded((v) => !v);
  };

  const startRename = (): void => setRenaming(node.name);
  const commitRename = (): void => {
    if (renaming !== null && renaming.trim().length > 0 && renaming !== node.name) {
      renameNode(id, renaming.trim());
    }
    setRenaming(null);
  };

  return (
    <>
      <div
        ref={setRef}
        className={`${styles.row} ${selected ? styles.selected : ''} ${isOver ? styles.dropOver : ''}`}
        style={{ paddingLeft: 4 + depth * 12, opacity: isDragging ? 0.5 : 1 }}
        onClick={() => selectNode(id)}
        onDoubleClick={startRename}
        {...listeners}
        {...attributes}
      >
        {isStack(node) && node.children.length > 0 ? (
          <span className={styles.chev} onClick={toggle}>
            {expanded ? '▾' : '▸'}
          </span>
        ) : (
          <span className={styles.chev} />
        )}
        {renaming !== null ? (
          <input
            ref={inputRef}
            className={styles.renameInput}
            value={renaming}
            onChange={(e) => setRenaming(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') setRenaming(null);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <span className={styles.name}>{node.name}</span>
            <span className={styles.typeTag}>{node.type}</span>
          </>
        )}
      </div>
      {isStack(node) &&
        expanded &&
        node.children.map((childId) => (
          <LayerRow key={childId} id={childId} depth={depth + 1} />
        ))}
    </>
  );
});
