import Modal from "./Modal";
import styles from "../AdminUsers.module.css";

export interface PendingTransaction {
  id: number;
  amount: number;
  balanceAfter: number;
  type: string;
  status: string;
  notes: string;
  createdAt: number;
  userEmail: string;
  userPhone?: string;
  userAccountNumber?: string;
}

interface ApproveTransactionModalProps {
  transaction: PendingTransaction;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ApproveTransactionModal({
  transaction,
  isPending,
  onClose,
  onConfirm,
}: ApproveTransactionModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Confirm Transaction Approval"
      subtitle="Are you sure you want to approve this transaction? This action is irreversible."
      size="sm"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
            <span style={{ fontWeight: "700", color: "var(--primary)" }}>₹{transaction.amount.toFixed(2)}</span>
          </div>
          {transaction.notes && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Notes:</span>
              <span>{transaction.notes}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            className={styles.approveBtn}
            onClick={onConfirm}
            disabled={isPending}
            style={{ flex: 1, padding: "12px", justifyContent: "center" }}
          >
            {isPending ? "Approving..." : "Confirm Approval"}
          </button>
          <button
            className={styles.viewBtn}
            onClick={onClose}
            style={{ flex: 1, padding: "12px", justifyContent: "center" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
