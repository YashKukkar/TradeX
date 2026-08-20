import React, { useState } from "react";
import styles from "../WalletModal.module.css";

interface CardPaymentStepProps {
  onSubmit: (cardData: { number: string; expiry: string; cvv: string; name: string }) => void;
  onBack: () => void;
  errorMsg: string;
}

export default function CardPaymentStep({ onSubmit, onBack, errorMsg }: CardPaymentStepProps) {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (cardNumber.length < 15 || cardExpiry.length < 4 || cardCvv.length < 3 || !cardName.trim()) {
      setLocalError("Please enter all card details correctly.");
      return;
    }
    setLocalError("");
    onSubmit({ number: cardNumber, expiry: cardExpiry, cvv: cardCvv, name: cardName });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <label className={styles.label}>Cardholder Name</label>
        <input
          type="text"
          placeholder="Cardholder Name"
          value={cardName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardName(e.target.value)}
          className={styles.input}
          required
        />
      </div>
      <div className={styles.inputGroup}>
        <label className={styles.label}>Card Number</label>
        <input
          type="text"
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          value={cardNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setCardNumber(
              e.target.value
                .replace(/\D/g, "")
                .replace(/(.{4})/g, "$1 ")
                .trim()
            );
          }}
          className={styles.input}
          required
        />
      </div>
      <div className={styles.row}>
        <div className={styles.inputGroup} style={{ flex: 1 }}>
          <label className={styles.label}>Expiry (MM/YY)</label>
          <input
            type="text"
            placeholder="MM/YY"
            maxLength={5}
            value={cardExpiry}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setCardExpiry(
                e.target.value
                  .replace(/\D/g, "")
                  .replace(/(.{2})/, "$1/")
                  .trim()
              );
            }}
            className={styles.input}
            required
          />
        </div>
        <div className={styles.inputGroup} style={{ flex: 1 }}>
          <label className={styles.label}>CVV</label>
          <input
            type="password"
            placeholder="123"
            maxLength={3}
            value={cardCvv}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardCvv(e.target.value.replace(/\D/g, ""))}
            className={styles.input}
            required
          />
        </div>
      </div>
      {(localError || errorMsg) && <div className={styles.error}>{localError || errorMsg}</div>}
      <div className={styles.actions}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          Back
        </button>
        <button type="submit" className={styles.submitBtn}>
          Send OTP
        </button>
      </div>
    </form>
  );
}
