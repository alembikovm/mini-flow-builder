
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useCallback, type ReactNode } from 'react';
import { useEditor } from './store';
import type { NodeType } from '../core/model';

export function AppProviders({ children }: { children: ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const addNode = useEditor((s) => s.addNode);
  const moveNode = useEditor((s) => s.moveNode);
  const selectNode = useEditor((s) => s.selectNode);
  const doc = useEditor((s) => s.history.doc);
  const currentScreenId = useEditor((s) => s.currentScreenId);

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const over = e.over;
      const active = e.active;
      if (!over) return;

      const activeData = active.data.current as
        | { kind: 'palette'; nodeType: NodeType }
        | { kind: 'layer'; nodeId: string }
        | undefined;
      const overData = over.data.current as { kind: 'stack-drop'; nodeId: string } | undefined;

      if (!activeData) return;

      let targetStackId: string | null = null;
      if (overData?.kind === 'stack-drop') targetStackId = overData.nodeId;
      else if (over.id === 'canvas-root') {
        const screen = doc.screens[currentScreenId];
        targetStackId = screen?.rootId ?? null;
      }
      if (!targetStackId) return;

      if (activeData.kind === 'palette') {
        const newId = addNode(activeData.nodeType, targetStackId);
        selectNode(newId);
      } else if (activeData.kind === 'layer') {
        const target = doc.nodes[targetStackId];
        if (!target || target.type !== 'stack') return;
        try {
          moveNode(activeData.nodeId, targetStackId, target.children.length);
        } catch {
          void 0;
        }
      }
    },
    [addNode, moveNode, selectNode, doc, currentScreenId],
  );

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      {children}
    </DndContext>
  );
}
