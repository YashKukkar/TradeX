import React, { useState } from "react";
import Icon from "../Icon";
import styles from "../PaymentGatewayModal.module.css";

interface OTPPaymentStepProps {
  onSubmit: (otp: string) => void;
  onBack: () => void;
  errorMsg: string;
}

export default function OTPPaymentStep({ onSubmit, onBack, errorMsg }: OTPPaymentStepProps) {
  const [otpCode, setOtpCode] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (otpCode !== "123456") {
      setLocalError("Invalid OTP. Enter 123456 for testing simulation.");
      return;
    }
    setLocalError("");
    onSubmit(otpCode);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.otpSection}>
        <Icon name="sms" className={styles.otpLogo} />
        <label className={styles.label}>Enter 6-Digit OTP</label>
        <input
          type="text"
          placeholder="Enter Code"
          maxLength={6}
          value={otpCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtpCode(e.target.value.replace(/\D/g, ""))}
          className={styles.otpInput}
          required
        />
        <span className={styles.hint}>
          Use mock simulation OTP: <strong>123456</strong>
        </span>
      </div>
      {(localError || errorMsg) && <div className={styles.error}>{localError || errorMsg}</div>}
      <div className={styles.actions}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          Back
        </button>
        <button type="submit" className={styles.submitBtn}>
          Verify & Pay
        </button>
      </div>
    </form>
  );
}
