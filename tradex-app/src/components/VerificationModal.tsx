import React, { useEffect, useRef } from "react";
import Icon from "./Icon";
import Modal from "./Modal";
import styles from "../Dashboard.module.css";

interface VerificationModalProps {
  target: "email" | "phone";
  onSubmit: (otp: string) => void;
  onClose: () => void;
  isLoading: boolean;
  errorMsg: string;
  isSuccess: boolean;
  onResend: () => Promise<void>;
}

export default function VerificationModal({
  target,
  onSubmit,
  onClose,
  isLoading,
  errorMsg,
  isSuccess,
  onResend,
}: VerificationModalProps) {
  const [otpCode, setOtpCode] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendError, setResendError] = React.useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleFormSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      onSubmit(otpCode);
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendError("");
    try {
      await onResend();
      setCooldown(60);
    } catch (err: any) {
      setResendError(err.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Verify Your ${target === "email" ? "Email Address" : "Phone Number"}`}
      subtitle={`We've simulated sending a 6-digit OTP code to your registered ${target === "email" ? "email" : "phone number"}.`}
      size="sm"
      closeBtnRef={closeBtnRef}
    >
      <form onSubmit={handleFormSubmit} className={styles.modalForm}>
        {/* TODO-PROD: Remove sandbox OTP label once notification server is connected. */}
        <div
          style={{
            background: "rgba(255, 179, 0, 0.1)",
            border: "1px solid rgba(255, 179, 0, 0.25)",
            color: "#ffb300",
            borderRadius: "8px",
            padding: "8px 10px",
            fontSize: "11.5px",
            fontWeight: "600",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Icon name="info" style={{ fontSize: "14px" }} />
          <span>Test Code: Use the verification code 123456 to proceed.</span>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="otp-input" className={styles.inputLabel}>
            Enter 6-Digit OTP
          </label>
          <input
            id="otp-input"
            ref={inputRef}
            type="text"
            placeholder="e.g. 123456"
            maxLength={6}
            value={otpCode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setOtpCode(e.target.value.replace(/\D/g, ""));
            }}
            className={styles.otpInput}
            disabled={isLoading || isSuccess}
            required
            aria-required="true"
            autoComplete="one-time-code"
          />
          <span className={styles.hintText}>
            For testing/simulation, enter <strong>123456</strong>
          </span>
        </div>

        {errorMsg && <div className={styles.errorMessage} role="alert">{errorMsg}</div>}
        {isSuccess && (
          <div className={styles.successMessage} role="status">
            <Icon name="verified" style={{ marginRight: "6px", verticalAlign: "middle" }} />
            Verification completed successfully!
          </div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading || isSuccess || otpCode.length < 6}
        >
          {isLoading ? "Verifying..." : isSuccess ? "Verified!" : "Submit Code"}
        </button>

        <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px" }}>
          <span>Didn't receive the code? </span>
          <button
            type="button"
            onClick={handleResendClick}
            disabled={cooldown > 0 || resendLoading || isSuccess}
            style={{
              background: "none",
              border: "none",
              color: cooldown > 0 || resendLoading || isSuccess ? "#888" : "#3b82f6",
              cursor: cooldown > 0 || resendLoading || isSuccess ? "default" : "pointer",
              fontWeight: "600",
              textDecoration: cooldown > 0 || resendLoading || isSuccess ? "none" : "underline",
              padding: 0,
            }}
          >
            {resendLoading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
          </button>
          {resendError && (
            <div style={{ color: "#ef4444", fontSize: "11.5px", marginTop: "4px" }} role="alert">
              {resendError}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
