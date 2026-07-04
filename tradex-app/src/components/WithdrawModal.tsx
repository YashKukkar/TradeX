import { useState } from "react";
import Modal from "./Modal";
import { useWithdraw } from "../hooks/useDashboard";
import cwStyles from "./CashWallet.module.css";
import Icon from "./Icon";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  withdrawableBalance: number;
  accountNumber: string;
}

export default function WithdrawModal({
  isOpen,
  onClose,
  withdrawableBalance,
  accountNumber,
}: WithdrawModalProps) {
  const [withAmt, setWithAmt] = useState("");
  const [withError, setWithError] = useState("");
  const [withSuccess, setWithSuccess] = useState("");

  const withdrawMutation = useWithdraw(
    () => {
      setWithSuccess(
        `Withdrawal request submitted!\n\nWe've received your request for ₹${parseFloat(
          withAmt
        ).toFixed(2)}. We will review it shortly, and once approved, the funds will be transferred to your linked bank account.`
      );
      setWithAmt("");
      setWithError("");
    },
    (err) => {
      setWithError(err || "We couldn't process your withdrawal. Please try again.");
      setWithSuccess("");
    }
  );

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber) {
      setWithError("You'll need to link your bank account before you can withdraw funds.");
      return;
    }

    if (withAmt.includes(".") && withAmt.split(".")[1].length > 2) {
      setWithError("Withdrawal amounts can only include up to two decimal places (paise).");
      return;
    }

    const amt = parseFloat(withAmt);
    if (isNaN(amt) || amt <= 0) {
      setWithError("Please enter a withdrawal amount greater than ₹0.");
      return;
    }
    if (amt < 100) {
      setWithError("The minimum withdrawal amount is ₹100.00.");
      return;
    }
    if (amt > 50000) {
      setWithError("The maximum withdrawal amount per transaction is ₹50,000.00.");
      return;
    }
    if (amt > withdrawableBalance) {
      setWithError("You don't have enough withdrawable balance for this request.");
      return;
    }
    setWithError("");
    setWithSuccess("");
    withdrawMutation.mutate({ amount: amt });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Withdraw Funds"
      subtitle="Transfer cash from your withdrawable balance to your bank account"
      size="sm"
    >
      <form onSubmit={handleWithdrawSubmit} className={cwStyles.modalForm}>
        <div
          style={{
            background: "rgba(255, 179, 0, 0.1)",
            border: "1px solid rgba(255, 179, 0, 0.25)",
            color: "#ffb300",
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
            Withdrawable Balance: <strong>₹{withdrawableBalance.toFixed(2)}</strong>
          </span>
          <span className={cwStyles.modalBalanceText}>
            Linked Account: <strong>{accountNumber || "None (Please link first)"}</strong>
          </span>
        </div>

        {/* TODO-PROD: Integrate bank payout APIs (IMPS/NEFT) and remove simulated notifications. */}
        <div className={cwStyles.modalInputGroup}>
          <label className={cwStyles.modalInputLabel}>
            Withdrawal Amount (₹)
          </label>
          <input
            type="number"
            placeholder="e.g. 500"
            value={withAmt}
            onChange={(e) => {
              setWithAmt(e.target.value);
              setWithError("");
              setWithSuccess("");
            }}
            className={cwStyles.modalInput}
            required
            disabled={withdrawMutation.isPending || !accountNumber || !!withSuccess}
          />
        </div>

        {withError && (
          <div className={cwStyles.modalError}>
            {withError}
          </div>
        )}

        {withSuccess && (
          <div className={cwStyles.modalSuccess}>
            {withSuccess}
          </div>
        )}

        <div className={cwStyles.modalActionButtons}>
          <button
            type="button"
            className={cwStyles.modalCancelBtn}
            onClick={onClose}
          >
            {withSuccess ? "Close" : "Cancel"}
          </button>
          {!withSuccess && (
            <button
              type="submit"
              className={cwStyles.modalSubmitBtn}
              disabled={withdrawMutation.isPending || !accountNumber || !withAmt}
            >
              {withdrawMutation.isPending ? "Processing..." : "Withdraw"}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
