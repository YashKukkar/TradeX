import { useState, useEffect } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import styles from "./WalletModal.module.css";
import cwStyles from "./CashWallet.module.css";
import { useConvertPoints } from "../hooks/useDashboard";
import type { SystemSetting } from "../utils/dashboardHelpers";
import { formatNumber, formatCurrency } from "../utils/formatters";

interface PointsConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointsBalance?: number;
  publicSettings?: SystemSetting;
}

export default function PointsConvertModal({
  isOpen,
  onClose,
  pointsBalance = 0,
  publicSettings,
}: PointsConvertModalProps) {
  const [convPoints, setConvPoints] = useState("");
  const [convError, setConvError] = useState("");
  const [convSuccess, setConvSuccess] = useState(false);
  const [convFailed, setConvFailed] = useState(false);
  const [convSuccessPoints, setConvSuccessPoints] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setConvPoints("");
      setConvError("");
      setConvSuccess(false);
      setConvFailed(false);
      setConvSuccessPoints("");
    }
  }, [isOpen]);

  const convertPointsMutation = useConvertPoints(
    () => {
      setConvSuccessPoints(convPoints);
      setConvSuccess(true);
      setConvFailed(false);
      setConvError("");
    },
    (err) => {
      setConvError(err || "We couldn't convert your points right now. Please try again.");
      setConvSuccess(false);
      setConvFailed(true);
    }
  );

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d+$/.test(convPoints)) {
      setConvError("Please enter a whole number of points.");
      return;
    }

    const pts = Number(convPoints);
    if (pts <= 0) {
      setConvError("Enter a points amount greater than 0 to convert.");
      return;
    }
    if (pts > pointsBalance) {
      setConvError("You don't have enough points for this conversion.");
      return;
    }

    setConvError("");
    setConvSuccess(false);
    setConvFailed(false);
    convertPointsMutation.mutate({ points: pts });
  };

  const estimatedValue = (parseFloat(convSuccessPoints || "0") / (publicSettings?.pointsToCashConversionRate || 1));
  const modalTitle = convSuccess ? "Transaction Successful" : convFailed ? "Transaction Failed" : "Convert TradeX Points";
  const modalSubtitle = (convSuccess || convFailed) ? undefined : "Exchange your earned TradeX points directly into wallet bonus cash balance";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      size="sm"
    >
      {convSuccess ? (
        <div className={styles.success}>
          <div className={styles.successCircle}>
            <Icon name="check" className={styles.checkIcon} />
          </div>
          <h4 className={styles.successAmt}>
            Points Converted Successfully
          </h4>
          <p className={styles.successDesc}>
            Your conversion of <strong>{formatNumber(parseInt(convSuccessPoints || "0"))} TradeX Points</strong> has been successfully processed. You have received <strong>{formatCurrency(estimatedValue)}</strong> in bonus cash.
          </p>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Return to Dashboard
          </button>
        </div>
      ) : convFailed ? (
        <div className={styles.errorView}>
          <div className={styles.errorCircle}>
            <Icon name="error_outline" className={styles.errorIcon} />
          </div>
          <h4 className={styles.successAmt} style={{ color: "var(--danger)" }}>
            Conversion Failed
          </h4>
          <p className={styles.errorText}>
            {convError || "We couldn't convert your points right now. Please try again."}
          </p>
          <button type="button" className={styles.doneBtn} onClick={() => { setConvFailed(false); setConvError(""); }}>
            Retry Conversion
          </button>
        </div>
      ) : (
        <form onSubmit={handleConvertSubmit} className={cwStyles.modalForm}>
          <div className={cwStyles.modalBalanceRow}>
            <span className={cwStyles.modalBalanceText}>
              TradeX Points Balance: <strong>{pointsBalance}</strong>
            </span>
            <span className={cwStyles.modalBalanceText}>
              Conversion Rate: <strong>{publicSettings?.pointsToCashConversionRate ? `${publicSettings.pointsToCashConversionRate} Points = ₹1.00` : "..."}</strong>
            </span>
          </div>

          <div className={cwStyles.modalInputGroup}>
            <label className={cwStyles.modalInputLabel}>
              Points to Convert
            </label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={convPoints}
              onChange={(e) => {
                setConvPoints(e.target.value);
                setConvError("");
              }}
              className={cwStyles.modalInput}
              min="1"
              step="1"
              required
              disabled={convertPointsMutation.isPending || publicSettings?.pointsConversionEnabled === false}
            />
            {convPoints && publicSettings?.pointsToCashConversionRate && (
              <span className={cwStyles.modalEstimate}>
                Estimate Value: ₹{(parseFloat(convPoints) / publicSettings.pointsToCashConversionRate).toFixed(2)}
              </span>
            )}
          </div>

          {convError && (
            <div className={cwStyles.modalError}>
              {convError}
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
              disabled={
                convertPointsMutation.isPending ||
                publicSettings?.pointsConversionEnabled === false ||
                !convPoints
              }
            >
              {convertPointsMutation.isPending ? (
                <span>Converting...</span>
              ) : (
                "Convert"
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
