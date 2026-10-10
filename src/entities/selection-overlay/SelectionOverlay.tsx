// Overlay rendered OUTSIDE the preview DOM. The preview is kept pixel-identical
// to what a device would render — no selection styling leaks into it. We find
// node rects by querying `[data-node-id="<id>"]` within the stage, convert
// bounding rects to the stage's coordinate space, and recompute on resize
// (via ResizeObserver) or when the doc changes (via the `revision` prop).

import { useEffect, useLayoutEffect, useMemo, useState, type RefObject } from 'react';
import type { Node, NodeId } from '../../core/model';

type Rect = { left: number; top: number; width: number; height: number };

export type SelectionOverlayProps = {
  /** The preview container; getBoundingClientRect is relative to this. */
  stageRef: RefObject<HTMLElement | null>;
  selectedId: NodeId | null;
  hoveredId: NodeId | null;
  /** A monotonic number that bumps whenever the doc changes. */
  revision: number;
  /** Looked up to display the node name next to the selection outline. */
  nodeNameLookup: (id: NodeId) => string | null;
  disabled?: boolean;
};

function readRect(stage: HTMLElement, id: NodeId): Rect | null {
  const el = stage.querySelector<HTMLElement>(`[data-node-id="${CSS.escape(id)}"]`);
  if (!el) return null;
  const sr = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return {
    left: r.left - sr.left,
    top: r.top - sr.top,
    width: r.width,
    height: r.height,
  };
}

export function SelectionOverlay({
  stageRef,
  selectedId,
  hoveredId,
  revision,
  nodeNameLookup,
  disabled = false,
}: SelectionOverlayProps) {
  const [selectedRect, setSelectedRect] = useState<Rect | null>(null);
  const [hoveredRect, setHoveredRect] = useState<Rect | null>(null);

  const recompute = useMemo(
    () => () => {
      const stage = stageRef.current;
      if (!stage) return;
      setSelectedRect(selectedId ? readRect(stage, selectedId) : null);
      setHoveredRect(hoveredId ? readRect(stage, hoveredId) : null);
    },
    [stageRef, selectedId, hoveredId],
  );

  useLayoutEffect(() => {
    recompute();
  }, [recompute, revision]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(() => recompute());
    ro.observe(stage);
    stage.querySelectorAll<HTMLElement>('[data-node-id]').forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [stageRef, recompute, revision]);

  if (disabled) return null;

  const selectedName = selectedId ? nodeNameLookup(selectedId) : null;
  const showHover = hoveredRect && hoveredId !== selectedId;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {showHover && (
        <div
          style={{
            position: 'absolute',
            left: hoveredRect.left,
            top: hoveredRect.top,
            width: hoveredRect.width,
            height: hoveredRect.height,
            outline: '1px solid #2563EB80',
            outlineOffset: -1,
          }}
        />
      )}
      {selectedRect && (
        <>
          <div
            style={{
              position: 'absolute',
              left: selectedRect.left,
              top: selectedRect.top,
              width: selectedRect.width,
              height: selectedRect.height,
              outline: '2px solid #2563EB',
              outlineOffset: -1,
            }}
          />
          {selectedName && (
            <div
              style={{
                position: 'absolute',
                left: selectedRect.left,
                top: Math.max(0, selectedRect.top - 20),
                background: '#2563EB',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 11,
                lineHeight: '14px',
                fontFamily: 'ui-sans-serif, system-ui',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedName}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Produce a lookup that resolves node names from a `Record<NodeId, Node>`. */
export const makeNameLookup =
  (nodes: Record<NodeId, Node>) =>
  (id: NodeId): string | null =>
    nodes[id]?.name ?? null;
