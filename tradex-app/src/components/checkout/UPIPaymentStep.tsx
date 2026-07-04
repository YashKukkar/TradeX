import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import styles from "../PaymentGatewayModal.module.css";

interface UPIPaymentStepProps {
  amount: number;
  onSubmit: (upiId: string) => void;
  onBack: () => void;
  errorMsg: string;
}

export default function UPIPaymentStep({ amount, onSubmit, onBack, errorMsg }: UPIPaymentStepProps) {
  const [upiId, setUpiId] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!upiId.includes("@")) {
      setLocalError("Please enter a valid UPI ID (e.g., user@okhdfc)");
      return;
    }
    setLocalError("");
    onSubmit(upiId);
  };

  const note = "TradeX Deposit";
  const payeeVpa = "9545719126@ibl";
  const payeeName = "Yash Jtendra Kukkar";
  const upiUrl = `upi://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrCodeUrl = `upi://pay?pa=${payeeVpa}&pn=${payeeName}&am=${amount.toFixed(2)}&cu=INR&tn=${note}`;

  const handleMobileIntent = () => {
    window.location.href = upiUrl;
  };

  return (
    <div className={styles.upiContent}>
      <div className={styles.qrSection}>
        <QRCodeSVG
          value={qrCodeUrl}
          size={256}
          level="M"
          includeMargin={true}
          className={styles.qrImage}
        />
        <span className={styles.qrLabel}>Scan QR code using GPay, PhonePe, or BHIM</span>
      </div>

      <div className={styles.mobileOnlyAction}>
        <button
          type="button"
          className={styles.upiIntentBtn}
          onClick={handleMobileIntent}
        >
          Pay via UPI App
        </button>
      </div>

      <div className={styles.divider}>
        <span>OR</span>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>Enter UPI ID</label>
          <input
            type="text"
            placeholder="e.g. mobileNumber@ybl"
            value={upiId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpiId(e.target.value)}
            className={styles.input}
            required
          />
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
    </div>
  );
}
