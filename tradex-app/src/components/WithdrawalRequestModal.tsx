import { useState, useEffect } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import styles from "./WalletModal.module.css";
import cwStyles from "./CashWallet.module.css";
import { useWithdraw, useCurrentUser } from "../hooks/useDashboard";
import { getPrimaryAccountNumber } from "../utils/dashboardHelpers";
import { formatCurrency } from "../utils/formatters";

interface WithdrawalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawableBalance?: number;
}

export default function WithdrawalRequestModal({
  isOpen,
  onClose,
  withdrawableBalance = 0,
}: WithdrawalRequestModalProps) {
  const { data: currentUser } = useCurrentUser();
  const [withAmount, setWithAmount] = useState("");
  const [withError, setWithError] = useState("");
  const [withSuccess, setWithSuccess] = useState(false);
  const [withFailed, setWithFailed] = useState(false);
  const [withSuccessAmt, setWithSuccessAmt] = useState("");

  const primaryAccount = getPrimaryAccountNumber(currentUser);
  const hasBankAccount = Boolean(primaryAccount);

  useEffect(() => {
    if (!isOpen) {
      setWithAmount("");
      setWithError("");
      setWithSuccess(false);
      setWithFailed(false);
      setWithSuccessAmt("");
    }
  }, [isOpen]);

  const withdrawMutation = useWithdraw(
    () => {
      setWithSuccessAmt(withAmount);
      setWithSuccess(true);
      setWithFailed(false);
      setWithError("");
    },
    (err) => {
      setWithError(err || "We couldn't process your withdrawal. Please try again.");
      setWithSuccess(false);
      setWithFailed(true);
    }
  );

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasBankAccount) {
      setWithError("Link a primary bank account before requesting a withdrawal.");
      return;
    }

    const amt = parseFloat(withAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithError("Enter a withdrawal amount greater than ₹0.");
      return;
    }
    if (amt > withdrawableBalance) {
      setWithError("You cannot withdraw more than your available withdrawable balance.");
      return;
    }

    setWithError("");
    setWithSuccess(false);
    setWithFailed(false);
    withdrawMutation.mutate({ amount: amt });
  };

  const modalTitle = withSuccess ? "Transaction Successful" : withFailed ? "Transaction Failed" : "Withdraw Funds";
  const modalSubtitle = (withSuccess || withFailed) ? undefined : "Transfer cash from your withdrawable balance to your bank account";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="sm"
    >
      {withSuccess ? (
        <div className={styles.success}>
          <div className={styles.successCircle}>
            <Icon name="check" className={styles.checkIcon} />
          </div>
          <h4 className={styles.successAmt}>
            Withdrawal Request Submitted
          </h4>
          <p className={styles.successDesc}>
            Your withdrawal request of <strong>{formatCurrency(parseFloat(withSuccessAmt || "0"))}</strong> has been successfully submitted and is pending admin approval.
          </p>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Return to Dashboard
          </button>
        </div>
      ) : withFailed ? (
        <div className={styles.errorView}>
          <div className={styles.errorCircle}>
            <Icon name="error_outline" className={styles.errorIcon} />
          </div>
          <h4 className={styles.successAmt} style={{ color: "var(--danger)" }}>
            Withdrawal Failed
          </h4>
          <p className={styles.errorText}>
            {withError || "We couldn't process your withdrawal. Please try again."}
          </p>
          <button type="button" className={styles.doneBtn} onClick={() => { setWithFailed(false); setWithError(""); }}>
            Retry Withdrawal
          </button>
        </div>
      ) : (
        <form onSubmit={handleWithdrawSubmit} className={cwStyles.modalForm}>
          <div
            style={{
              background: "var(--warning-bg)",
              border: "1px solid var(--warning-border)",
              color: "var(--warning)",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Icon name="info" style={{ fontSize: "16px" }} />
            <span>Note: Withdrawals are simulated in this preview. No real money will be transferred to your bank.</span>
          </div>

          <div className={cwStyles.modalBalanceRow}>
            <span className={cwStyles.modalBalanceText}>
              Withdrawable Balance: <strong>{formatCurrency(withdrawableBalance)}</strong>
            </span>
            <span className={cwStyles.modalBalanceText}>
              Linked Account: <strong>{primaryAccount || "None (Please link first)"}</strong>
            </span>
          </div>

          <div className={cwStyles.modalInputGroup}>
            <label className={cwStyles.modalInputLabel}>
              Withdrawal Amount (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={withAmount}
              onChange={(e) => {
                setWithAmount(e.target.value);
                setWithError("");
              }}
              className={cwStyles.modalInput}
              required
              disabled={withdrawMutation.isPending || !hasBankAccount}
            />
          </div>

          {withError && (
            <div className={cwStyles.modalError}>
              {withError}
            </div>
          )}

          <div className={cwStyles.modalActionButtons}>
            <button
              type="button"
              className={cwStyles.modalCancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cwStyles.modalSubmitBtn}
              disabled={withdrawMutation.isPending || !hasBankAccount || !withAmount}
            >
              {withdrawMutation.isPending ? (
                <span>Processing...</span>
              ) : (
                "Withdraw"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
