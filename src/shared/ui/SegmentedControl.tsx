import styles from './SegmentedControl.module.css';

export type SegmentOption<T extends string> = {
  value: T;
  label?: string;
  icon?: React.ReactNode;
  title?: string;
};

export type SegmentedControlProps<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: readonly SegmentOption<T>[];
  full?: boolean;
};

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  full,
}: SegmentedControlProps<T>) {
  return (
    <div className={`${styles.seg} ${full ? styles.full : ''}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`${styles.btn} ${opt.value === value ? styles.active : ''}`}
          onClick={() => onChange(opt.value)}
          title={opt.title ?? opt.label}
        >
          {opt.icon ?? opt.label ?? opt.value}
        </button>
      ))}
    </div>
  );
}
