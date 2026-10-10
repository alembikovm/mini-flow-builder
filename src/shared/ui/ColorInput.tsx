import { useEffect, useState } from 'react';
import styles from './ColorInput.module.css';
import type { Color } from '../../core/model';

export type ColorInputProps = {
  value: Color | undefined;
  onChange: (c: Color) => void;
};

const HEX = /^#(?:[0-9a-fA-F]{6})$/;

function ColorRow({ hex, onCommit }: { hex: string; onCommit: (hex: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => {
    setDraft(null);
  }, [hex]);
  const display = draft ?? hex;
  return (
    <div className={styles.row}>
      <div className={styles.swatchWrap}>
        <div className={styles.swatch} style={{ background: hex }} />
        <input
          type="color"
          value={hex}
          onChange={(e) => onCommit(e.target.value)}
          aria-label="color"
        />
      </div>
      <input
        className={styles.hex}
        value={display}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) {
            if (HEX.test(draft)) onCommit(draft);
            setDraft(null);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') setDraft(null);
        }}
      />
    </div>
  );
}

const DEFAULT: Color = { light: '#FFFFFF', dark: '#000000' };

export function ColorInput({ value, onChange }: ColorInputProps) {
  const v = value ?? DEFAULT;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className={styles.themeLabel}>L</span>
        <div style={{ flex: 1 }}>
          <ColorRow hex={v.light} onCommit={(hex) => onChange({ ...v, light: hex })} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className={styles.themeLabel}>D</span>
        <div style={{ flex: 1 }}>
          <ColorRow hex={v.dark} onCommit={(hex) => onChange({ ...v, dark: hex })} />
        </div>
      </div>
    </div>
  );
}
