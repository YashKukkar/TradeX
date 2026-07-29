import { useState } from "react";
import Modal from "./Modal";
import styles from "../AdminUsers.module.css";
import type { PendingTransaction } from "./PendingTransactionsRegistry";

interface ResolveTransactionModalProps {
  transaction: PendingTransaction;
  isPending: boolean;
  mode: "approve" | "reject";
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

export default function ResolveTransactionModal({
  transaction,
  isPending,
  mode,
  onClose,
  onConfirm,
}: ResolveTransactionModalProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "reject") {
      if (reason.trim()) {
        onConfirm(reason.trim());
      }
    } else {
      onConfirm();
    }
  };

  const isReject = mode === "reject";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isReject ? "Confirm Transaction Rejection" : "Confirm Transaction Approval"}
      subtitle={
        isReject
          ? "Are you sure you want to reject this transaction? Please provide a reason."
          : "Are you sure you want to approve this transaction? This action is irreversible."
      }
      size="sm"
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ padding: "14px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13.5px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--muted)" }}>User:</span>
            <span style={{ fontWeight: "600" }}>{transaction.userEmail}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--muted)" }}>Type:</span>
            <span style={{ fontWeight: "600", textTransform: "capitalize" }}>{transaction.type.toLowerCase().replace(/_/g, " ")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--muted)" }}>Amount:</span>
            <span style={{ fontWeight: "700", color: isReject ? "var(--danger)" : "var(--primary)" }}>₹{transaction.amount.toFixed(2)}</span>
          </div>
          {transaction.notes && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Notes:</span>
              <span>{transaction.notes}</span>
            </div>
          )}
        </div>

        {isReject && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="rejectionReason" style={{ fontSize: "12px", fontWeight: "600", color: "var(--text)" }}>
              Rejection Reason
            </label>
            <input
              id="rejectionReason"
              name="rejectionReason"
              type="text"
              placeholder="e.g. Invalid account details or mismatch"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={150}
              required
              autoFocus
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-2)",
                color: "var(--text)",
                fontSize: "13px",
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            type="submit"
            className={isReject ? styles.rejectBtn : styles.approveBtn}
            disabled={isPending || (isReject && !reason.trim())}
            style={{ flex: 1, padding: "12px", justifyContent: "center" }}
          >
            {isPending
              ? isReject
                ? "Rejecting..."
                : "Approving..."
              : isReject
              ? "Confirm Rejection"
              : "Confirm Approval"}
          </button>
          <button
            type="button"
            className={styles.viewBtn}
            onClick={onClose}
            style={{ flex: 1, padding: "12px", justifyContent: "center" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
