import styles from "../AdminUsers.module.css";

interface SettingInputProps {
  label: string;
  value: number;
  disabled?: boolean;
  error?: string;
  min?: string;
  max?: string;
  onChange: (val: number) => void;
}

export default function SettingInput({ label, value, disabled, error, min, max, onChange }: SettingInputProps) {
  return (
    <div className={styles.inputGroup}>
      <div className={styles.inputHeader}>
        <label className={styles.inputLabel}>{label}</label>
        {error && <span className={styles.inputError}>{error}</span>}
      </div>
      <input
        type="number"
        min={min}
        max={max}
        disabled={disabled}
        value={value ?? ""}
        onChange={e => onChange(Number(e.target.value))}
        className={`${styles.inputField} ${error ? styles.inputFieldInvalid : ""}`}
      />
    </div>
  );
}
