import React from "react";
import styles from "../AdminUsers.module.css";

interface SettingFieldProps {
  type: "number" | "toggle";
  label: string; // Acts as toggle title or input label
  description?: string; // Acts as toggle description
  value?: number; // Acts as value for number input
  checked?: boolean; // Acts as state for toggle checkbox
  disabled?: boolean;
  error?: string; // Acts as validation error message
  min?: string;
  max?: string;
  onChange: (val: any) => void;
  style?: React.CSSProperties;
}

export default function SettingField({
  type,
  label,
  description,
  value,
  checked = false,
  disabled,
  error,
  min,
  max,
  onChange,
  style,
}: SettingFieldProps) {
  if (type === "toggle") {
    return (
      <div className={styles.toggleRow} style={style}>
        <div className={styles.toggleLabel}>
          <span className={styles.toggleTitle}>{label}</span>
          {description && <span className={styles.toggleDesc}>{description}</span>}
        </div>
        <label className={styles.switch}>
          <input
            type="checkbox"
            disabled={disabled}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className={styles.slider}></span>
        </label>
      </div>
    );
  }

  return (
    <div className={styles.inputGroup} style={style}>
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
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${styles.inputField} ${error ? styles.inputFieldInvalid : ""}`}
      />
    </div>
  );
}
