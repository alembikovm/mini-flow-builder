import { useEffect, useRef, useState } from 'react';
import styles from './ScreensBar.module.css';
import { useEditor } from '../../app/store';
import { findButtonsReferencing } from '../../core/ops';
import type { ScreenId } from '../../core/model';

export function ScreensBar() {
  const screenOrder = useEditor((s) => s.history.doc.screenOrder);
  const screens = useEditor((s) => s.history.doc.screens);
  const currentScreenId = useEditor((s) => s.currentScreenId);
  const setCurrentScreen = useEditor((s) => s.setCurrentScreen);
  const addScreen = useEditor((s) => s.addScreen);
  const renameScreen = useEditor((s) => s.renameScreen);
  const removeScreen = useEditor((s) => s.removeScreen);
  const preview = useEditor((s) => s.preview);

  const [renaming, setRenaming] = useState<ScreenId | null>(null);

  if (preview) return null;

  return (
    <div className={styles.bar}>
      {screenOrder.map((id) => {
        const screen = screens[id];
        if (!screen) return null;
        const active = id === currentScreenId;
        if (renaming === id) {
          return (
            <ScreenTabRename
              key={id}
              defaultValue={screen.name}
              onCommit={(name) => {
                if (name.trim().length > 0) renameScreen(id, name.trim());
                setRenaming(null);
              }}
              onCancel={() => setRenaming(null)}
              active={active}
            />
          );
        }
        return (
          <div
            key={id}
            className={`${styles.tab} ${active ? styles.active : ''}`}
            onClick={() => setCurrentScreen(id)}
            onDoubleClick={() => setRenaming(id)}
          >
            {screen.name}
            {screenOrder.length > 1 && (
              <button
                className={styles.close}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(id);
                }}
                title="Delete screen"
                aria-label="Delete screen"
              >
                ✕
              </button>
            )}
          </div>
        );
      })}
      <button className={styles.add} onClick={() => addScreen(`Screen ${screenOrder.length + 1}`)}>
        + Add screen
      </button>
    </div>
  );

  function handleDelete(id: ScreenId): void {
    const refs = findButtonsReferencing(useEditor.getState().history.doc, id);
    if (refs.length > 0) {
      const ok = window.confirm(
        `${refs.length} button${refs.length === 1 ? '' : 's'} navigate to this screen. Delete anyway? Those actions will reset to "none".`,
      );
      if (!ok) return;
    }
    removeScreen(id);
  }
}

function ScreenTabRename({
  defaultValue,
  onCommit,
  onCancel,
  active,
}: {
  defaultValue: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
  active: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    ref.current?.select();
  }, []);
  return (
    <div className={`${styles.tab} ${active ? styles.active : ''}`}>
      <input
        ref={ref}
        className={styles.rename}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onCommit(value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') onCancel();
        }}
      />
    </div>
  );
}
