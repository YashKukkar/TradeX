import Icon from "../Icon";
import styles from "../WalletModal.module.css";

interface PaymentStatusStepProps {
  step: "processing" | "success" | "error";
  amount: number;
  loadingText?: string;
  errorMsg?: string;
  onSuccessDone: () => void;
  onErrorRetry: () => void;
}

export default function PaymentStatusStep({
  step,
  amount,
  loadingText,
  errorMsg,
  onSuccessDone,
  onErrorRetry,
}: PaymentStatusStepProps) {
  if (step === "processing") {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
        <span className={styles.loadingText}>{loadingText}</span>
        <span className={styles.secureBadge}>
          <Icon name="verified_user" style={{ fontSize: "14px", marginRight: "4px" }} />
          PCI-DSS Compliant Encryption
        </span>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className={styles.success}>
        <div className={styles.successCircle}>
          <Icon name="check" className={styles.checkIcon} />
        </div>
        <h4 className={styles.successAmt}>
          Deposit Request Submitted
        </h4>
        <p className={styles.successDesc}>
          Your deposit request of <strong>₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong> has been successfully submitted and is pending admin approval.
        </p>
        <button type="button" className={styles.doneBtn} onClick={onSuccessDone}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={styles.errorView}>
      <div className={styles.errorCircle}>
        <Icon name="error_outline" className={styles.errorIcon} />
      </div>
      <h4>Transaction Terminated</h4>
      <p className={styles.errorText}>{errorMsg || "An unknown error occurred."}</p>
      <button type="button" className={styles.doneBtn} onClick={onErrorRetry}>
        Retry Payment
      </button>
    </div>
  );
}
