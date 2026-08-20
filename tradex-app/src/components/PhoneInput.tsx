import React from "react";
import Icon from "./Icon";
import styles from "./PhoneInput.module.css";

interface PhoneInputProps {
  value: string;
  onChange: (digitsOnly: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = "98765 43210",
  disabled = false,
  className,
}: PhoneInputProps) {
  // Strip any non-digits and cap at 10 digits
  const rawDigits = (value || "").replace(/\D/g, "").slice(0, 10);

  // Format as 5-digit space 5-digit (e.g. 98765 43210)
  const formattedDisplay = rawDigits.length > 5 
    ? `${rawDigits.slice(0, 5)} ${rawDigits.slice(5)}`
    : rawDigits;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange(inputDigits);
  };

  const isValid = rawDigits.length === 10;

  return (
    <div className={`${styles.phoneInputContainer} ${disabled ? styles.disabled : ""} ${className || ""}`}>
      <div className={styles.countryPrefix}>
        <span className={styles.flagIcon} role="img" aria-label="India Flag">🇮🇳</span>
        <span className={styles.dialCode}>+91</span>
      </div>
      <input
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={11} // Account for space formatting
        className={styles.inputField}
        value={formattedDisplay}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      {isValid && (
        <div className={styles.validCheck}>
          <Icon name="check_circle" style={{ fontSize: "16px", color: "var(--primary)" }} />
        </div>
      )}
    </div>
  );
}
