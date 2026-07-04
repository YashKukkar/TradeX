import React from "react";
import styles from "../AdminUsers.module.css";

interface SettingToggleProps {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  style?: React.CSSProperties;
}

export default function SettingToggle({ title, desc, checked, disabled, onChange, style }: SettingToggleProps) {
  return (
    <div className={styles.toggleRow} style={style}>
      <div className={styles.toggleLabel}>
        <span className={styles.toggleTitle}>{title}</span>
        <span className={styles.toggleDesc}>{desc}</span>
      </div>
      <label className={styles.switch}>
        <input
          type="checkbox"
          disabled={disabled}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <span className={styles.slider}></span>
      </label>
    </div>
  );
}
