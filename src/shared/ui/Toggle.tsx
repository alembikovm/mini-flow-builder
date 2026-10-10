import styles from './Toggle.module.css';

export type ToggleProps = {
  value: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
};

export function Toggle({ value, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={value}
      aria-label={ariaLabel}
      className={`${styles.toggle} ${value ? styles.on : ''}`}
      onClick={() => onChange(!value)}
    >
      <span className={styles.knob} />
    </button>
  );
}
