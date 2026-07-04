import Icon from "../Icon";
import styles from "../PaymentGatewayModal.module.css";

interface NetbankingPaymentStepProps {
  bankName: string;
  onApprove: () => void;
  onCancel: () => void;
}

export default function NetbankingPaymentStep({ bankName, onApprove, onCancel }: NetbankingPaymentStepProps) {
  return (
    <div className={styles.nbRedirect}>
      <Icon name="account_balance" className={styles.nbLogo} />
      <h4 className={styles.bankName}>{bankName} Simulator</h4>
      <p className={styles.nbText}>
        In production, you will be redirected to the secure login page of{" "}
        <strong>{bankName}</strong>.
      </p>
      <div className={styles.nbSimulatorPill}>Mock Environment Sandbox Active</div>
      <div className={styles.actions} style={{ width: "100%", marginTop: "16px" }}>
        <button type="button" className={styles.backBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={styles.submitBtn} onClick={onApprove}>
          Approve Transfer
        </button>
      </div>
    </div>
  );
}
