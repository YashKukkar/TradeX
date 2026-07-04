import { useState, useEffect } from "react";
import Modal from "./Modal";
import { useConvertPoints } from "../hooks/useDashboard";
import type { SystemSetting } from "../utils/dashboardHelpers";
import cwStyles from "./CashWallet.module.css";

interface ConvertPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointsBalance: number;
  publicSettings: SystemSetting | undefined;
}

export default function ConvertPointsModal({
  isOpen,
  onClose,
  pointsBalance,
  publicSettings,
}: ConvertPointsModalProps) {
  const [convPoints, setConvPoints] = useState("");
  const [convError, setConvError] = useState("");
  const [convSuccess, setConvSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setConvPoints("");
      setConvError("");
      setConvSuccess("");
    }
  }, [isOpen]);

  const convertPointsMutation = useConvertPoints(
    () => {
      setConvSuccess("Success! Your TradeX Points have been converted to bonus cash.");
      setConvPoints("");
      setConvError("");
    },
    (err) => {
      setConvError(err || "We couldn't convert your points right now. Please try again.");
      setConvSuccess("");
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
    setConvSuccess("");
    convertPointsMutation.mutate({ points: pts });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert TradeX Points"
      subtitle="Convert points to bonus cash balance"
      size="sm"
    >
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
              setConvSuccess("");
            }}
            className={cwStyles.modalInput}
            min="1"
            step="1"
            required
            disabled={convertPointsMutation.isPending || publicSettings?.pointsConversionEnabled === false || !!convSuccess}
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

        {convSuccess && (
          <div className={cwStyles.modalSuccess}>
            {convSuccess}
          </div>
        )}

        <div className={cwStyles.modalActionButtons}>
          <button
            type="button"
            className={cwStyles.modalCancelBtn}
            onClick={onClose}
          >
            {convSuccess ? "Close" : "Cancel"}
          </button>
          {!convSuccess && (
            <button
              type="submit"
              className={cwStyles.modalSubmitBtn}
              disabled={
                convertPointsMutation.isPending ||
                publicSettings?.pointsConversionEnabled === false ||
                !convPoints
              }
            >
              {convertPointsMutation.isPending ? "Converting..." : "Convert"}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
