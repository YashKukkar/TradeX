import { useState } from "react";
import Modal from "./Modal";
import Icon from "./Icon";
import type { UserInfo } from "../utils/dashboardHelpers";
import { formatNumber } from "../utils/formatters";
import styles from "./AdjustPointsModal.module.css";

interface AdjustPointsModalProps {
  user: UserInfo;
  onClose: () => void;
  onConfirm: (delta: number, reason: string) => void;
  isPending: boolean;
}

const QUICK_PRESETS = [100, 500, 1000, 5000, 10000];

const PRESET_REASONS = [
  "Referral reward adjustment",
  "Support ticket compensation",
  "Promotional bonus allocation",
  "Manual system correction",
];

export default function AdjustPointsModal({ user, onClose, onConfirm, isPending }: AdjustPointsModalProps) {
  const [mode, setMode] = useState<"ADD" | "DEDUCT">("ADD");
  const [rawAmount, setRawAmount] = useState("");
  const [reason, setReason] = useState("");

  const numericAmount = Math.abs(parseInt(rawAmount, 10) || 0);
  const isValidAmount = numericAmount > 0;
  const delta = mode === "ADD" ? numericAmount : -numericAmount;
  const currentBalance = user.pointsBalance || 0;
  const newBalance = currentBalance + delta;
  const isNegativeResult = newBalance < 0;
  const canSubmit = isValidAmount && !isNegativeResult && reason.trim().length > 0 && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    onConfirm(delta, reason.trim());
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className={styles.headerIconBadge}>
            <Icon name="stars" />
          </div>
          <span>Adjust User Points</span>
        </div>
      }
      subtitle={user.email}
    >
      <div className={styles.body}>
        {/* Current Balance Banner */}
        <div className={styles.balanceBanner}>
          <span className={styles.balanceLabel}>Current Points Balance</span>
          <span className={styles.balanceValue}>{formatNumber(currentBalance)} pts</span>
        </div>

        {/* Mode Switcher Segment */}
        <div className={styles.modeSegment}>
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === "ADD" ? styles.modeBtnAddActive : ""}`}
            onClick={() => setMode("ADD")}
          >
            <Icon name="add_circle" style={{ fontSize: "16px" }} /> Add Points (+)
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${mode === "DEDUCT" ? styles.modeBtnDeductActive : ""}`}
            onClick={() => setMode("DEDUCT")}
          >
            <Icon name="remove_circle" style={{ fontSize: "16px" }} /> Deduct Points (-)
          </button>
        </div>

        {/* Amount Field & Quick Presets */}
        <div className={styles.fieldGroup}>
          <label htmlFor="pointAmount" className={styles.fieldLabel}>
            Points Amount ({mode === "ADD" ? "Addition" : "Deduction"})
          </label>
          <div className={styles.inputWrapper}>
            <span className={`${styles.inputPrefix} ${mode === "ADD" ? styles.inputPrefixAdd : styles.inputPrefixDeduct}`}>
              {mode === "ADD" ? "+" : "-"}
            </span>
            <input
              id="pointAmount"
              name="pointAmount"
              type="number"
              min="1"
              className={styles.amountInput}
              placeholder="e.g. 500"
              value={rawAmount}
              onChange={(e) => setRawAmount(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.presetContainer}>
            {QUICK_PRESETS.map((val) => (
              <button
                key={val}
                type="button"
                className={styles.presetPill}
                onClick={() => setRawAmount(val.toString())}
              >
                +{formatNumber(val)}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview Card */}
        {isValidAmount && (
          <div className={`${styles.previewCard} ${isNegativeResult ? styles.previewCardError : ""}`}>
            <span className={styles.previewTitle}>Resulting Balance Preview</span>
            <span className={`${styles.previewResult} ${isNegativeResult ? styles.previewResultError : ""}`}>
              {isNegativeResult ? "⚠️ Cannot result in negative balance!" : `${formatNumber(newBalance)} pts`}
            </span>
          </div>
        )}

        {/* Reason Field & Chips */}
        <div className={styles.fieldGroup}>
          <label htmlFor="adjustmentReason" className={styles.fieldLabel}>
            Adjustment Reason <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            id="adjustmentReason"
            name="adjustmentReason"
            type="text"
            className={styles.reasonInput}
            placeholder="Select preset below or type custom reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
          />
          <div className={styles.reasonChips}>
            {PRESET_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                className={styles.reasonChip}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button
            className={`${mode === "ADD" ? styles.submitBtnAdd : styles.submitBtnDeduct} ${!canSubmit ? styles.submitBtnDisabled : ""}`}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isPending
              ? "Applying..."
              : `${mode === "ADD" ? "Add" : "Deduct"} ${isValidAmount ? formatNumber(numericAmount) : ""} Points`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
