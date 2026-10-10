import { NumberInput } from './NumberInput';
import styles from './PaddingBox.module.css';
import type { Padding } from '../../core/model';

export type PaddingBoxProps = {
  value: Padding;
  onChange: (next: Padding) => void;
  onBeginScrub?: () => void;
  onEndScrub?: () => void;
};

export function PaddingBox({ value, onChange, onBeginScrub, onEndScrub }: PaddingBoxProps) {
  return (
    <div className={styles.wrap}>
      <NumberInput
        label="T"
        value={value.top}
        min={0}
        onChange={(v) => onChange({ ...value, top: v })}
        {...(onBeginScrub ? { onBeginScrub } : {})}
        {...(onEndScrub ? { onEndScrub } : {})}
      />
      <NumberInput
        label="R"
        value={value.right}
        min={0}
        onChange={(v) => onChange({ ...value, right: v })}
        {...(onBeginScrub ? { onBeginScrub } : {})}
        {...(onEndScrub ? { onEndScrub } : {})}
      />
      <NumberInput
        label="B"
        value={value.bottom}
        min={0}
        onChange={(v) => onChange({ ...value, bottom: v })}
        {...(onBeginScrub ? { onBeginScrub } : {})}
        {...(onEndScrub ? { onEndScrub } : {})}
      />
      <NumberInput
        label="L"
        value={value.left}
        min={0}
        onChange={(v) => onChange({ ...value, left: v })}
        {...(onBeginScrub ? { onBeginScrub } : {})}
        {...(onEndScrub ? { onEndScrub } : {})}
      />
    </div>
  );
}
