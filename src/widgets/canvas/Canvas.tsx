import { useCallback, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import styles from './Canvas.module.css';
import { useEditor } from '../../app/store';
import { NodeMount } from './NodeMount';
import { DEVICES } from './devices';
import { SelectionOverlay, makeNameLookup } from '../../entities/selection-overlay';

export function Canvas() {
  const stageRef = useRef<HTMLDivElement | null>(null);

  const device = useEditor((s) => s.device);
  const orientation = useEditor((s) => s.orientation);
  const theme = useEditor((s) => s.theme);
  const currentScreenId = useEditor((s) => s.currentScreenId);
  const screen = useEditor((s) => s.history.doc.screens[s.currentScreenId]);
  const selectedId = useEditor((s) => s.selectedNodeId);
  const hoveredId = useEditor((s) => s.hoveredNodeId);
  const preview = useEditor((s) => s.preview);
  // `revision` bumps every doc mutation (new history object reference) so the
  // overlay knows to recompute rects.
  const revision = useEditor((s) => s.history);
  const nodes = useEditor((s) => s.history.doc.nodes);

  const selectNode = useEditor((s) => s.selectNode);
  const setHover = useEditor((s) => s.setHover);
  const setDevice = useEditor((s) => s.setDevice);
  const setOrientation = useEditor((s) => s.setOrientation);
  const setTheme = useEditor((s) => s.setTheme);

  const spec = DEVICES[device];
  const w = orientation === 'portrait' ? spec.width : spec.height;
  const h = orientation === 'portrait' ? spec.height : spec.width;

  const findNodeId = useCallback((target: EventTarget | null): string | null => {
    if (!(target instanceof HTMLElement)) return null;
    const el = target.closest('[data-node-id]');
    return el instanceof HTMLElement ? el.dataset.nodeId ?? null : null;
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (preview) return;
      const id = findNodeId(e.target);
      setHover(id);
    },
    [preview, findNodeId, setHover],
  );

  const onPointerLeave = useCallback(() => {
    if (!preview) setHover(null);
  }, [preview, setHover]);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (preview) return;
      const id = findNodeId(e.target);
      selectNode(id);
    },
    [preview, findNodeId, selectNode],
  );

  // Fallback drop target: the whole phone screen accepts drops → appends to
  // the current screen's root. Per-stack precise drops land in M5+ via each
  // StackRenderer wrapping itself in a droppable — for M5 the layers tree
  // already supports precise re-parenting into any stack.
  const { setNodeRef: setCanvasDropRef, isOver: canvasIsOver } = useDroppable({
    id: 'canvas-root',
  });

  return (
    <div className={styles.canvas}>
      <div className={styles.deviceBar}>
        {Object.values(DEVICES).map((d) => (
          <button
            key={d.id}
            className={d.id === device ? styles.active : ''}
            onClick={() => setDevice(d.id)}
          >
            {d.label}
          </button>
        ))}
        <span style={{ width: 1, height: 16, background: 'var(--mfb-border)' }} />
        <button
          className={orientation === 'portrait' ? styles.active : ''}
          onClick={() => setOrientation('portrait')}
        >
          Portrait
        </button>
        <button
          className={orientation === 'landscape' ? styles.active : ''}
          onClick={() => setOrientation('landscape')}
        >
          Landscape
        </button>
        <span style={{ width: 1, height: 16, background: 'var(--mfb-border)' }} />
        <button className={theme === 'light' ? styles.active : ''} onClick={() => setTheme('light')}>
          Light
        </button>
        <button className={theme === 'dark' ? styles.active : ''} onClick={() => setTheme('dark')}>
          Dark
        </button>
      </div>

      <div className={styles.stageWrap}>
        <div
          className={styles.phone}
          style={{ borderRadius: spec.cornerRadius + 10, width: w + 20, height: h + 20 }}
        >
          <div
            ref={(el) => {
              stageRef.current = el;
              setCanvasDropRef(el);
            }}
            className={`${styles.phoneScreen} ${theme === 'dark' ? styles.dark : ''}`}
            style={{
              width: w,
              height: h,
              borderRadius: spec.cornerRadius,
              outline: canvasIsOver ? '2px dashed var(--mfb-accent)' : undefined,
              outlineOffset: 2,
            }}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            onClick={onClick}
          >
            <div className={styles.screenScroll}>
              {screen ? (
                <NodeMount key={currentScreenId} id={screen.rootId} />
              ) : (
                <div style={{ padding: 20, color: '#888' }}>No screen</div>
              )}
            </div>

            {!preview && (
              <>
                <div
                  className={`${styles.safeArea} ${theme === 'dark' ? styles.dark : ''} ${styles.safeAreaTop}`}
                  style={{ height: orientation === 'portrait' ? spec.safeTop : 8 }}
                />
                <div
                  className={`${styles.safeArea} ${theme === 'dark' ? styles.dark : ''} ${styles.safeAreaBottom}`}
                  style={{ height: orientation === 'portrait' ? spec.safeBottom : 8 }}
                />
              </>
            )}

            <SelectionOverlay
              stageRef={stageRef}
              selectedId={selectedId}
              hoveredId={hoveredId}
              revision={revisionNumber(revision)}
              nodeNameLookup={makeNameLookup(nodes)}
              disabled={preview}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Zustand would prefer a primitive for the subscription; derive one here.
function revisionNumber(history: unknown): number {
  // Each history object is a new reference per mutation; use its identity hash.
  // We only need a strictly-increasing-ish value for useEffect dependencies,
  // so turning the reference into a stable int is fine; but even cheaper is
  // to just use the length-sum, which changes on every commit/undo/redo.
  const h = history as { past?: unknown[]; future?: unknown[] };
  return (h.past?.length ?? 0) * 1000 + (h.future?.length ?? 0);
}
