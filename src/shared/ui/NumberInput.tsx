import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './NumberInput.module.css';

export type NumberInputProps = {
  value: number;
  onChange: (v: number) => void;
  /** Fired once when the user starts dragging the label (scrubbing). */
  onBeginScrub?: () => void;
  /** Fired once when the drag ends (pointer up or capture lost). */
  onEndScrub?: () => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Pixels of movement per 1 unit change. Default: 1 (1px = 1 step). */
  pxPerStep?: number;
};

/**
 * Number input with "drag the label to scrub" behaviour. The label-drag
 * creates one continuous edit that the caller wraps in a transaction, so a
 * drag that produces 50 intermediate values becomes a single undo step.
 */
export function NumberInput({
  value,
  onChange,
  onBeginScrub,
  onEndScrub,
  label,
  min,
  max,
  step = 1,
  pxPerStep = 1,
}: NumberInputProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startValue: number } | null>(null);

  const clampValue = useCallback(
    (v: number) => {
      let next = Math.round(v / step) * step;
      if (min !== undefined) next = Math.max(next, min);
      if (max !== undefined) next = Math.min(next, max);
      return next;
    },
    [min, max, step],
  );

  const onLabelPointerDown = (e: React.PointerEvent<HTMLSpanElement>): void => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startValue: value };
    onBeginScrub?.();
  };

  const onLabelPointerMove = (e: React.PointerEvent<HTMLSpanElement>): void => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const next = clampValue(d.startValue + dx / pxPerStep);
    if (next !== value) onChange(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLSpanElement>): void => {
    if (!dragRef.current) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
    onEndScrub?.();
  };

  const commitTyped = (raw: string): void => {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      const next = clampValue(parsed);
      if (next !== value) onChange(next);
    }
    setEditing(null);
  };

  // If `value` changes while editing (e.g. undo), discard the pending text.
  const prevValue = useRef(value);
  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      if (editing !== null) setEditing(null);
    }
  }, [value, editing]);

  return (
    <div className={styles.wrap}>
      {label !== undefined && (
        <span
          className={styles.label}
          onPointerDown={onLabelPointerDown}
          onPointerMove={onLabelPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {label}
        </span>
      )}
      <input
        className={styles.input}
        type="text"
        inputMode="decimal"
        value={editing ?? String(value)}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={() => editing !== null && commitTyped(editing)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setEditing(null);
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(clampValue(value + step));
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(clampValue(value - step));
          }
        }}
      />
    </div>
  );
}
