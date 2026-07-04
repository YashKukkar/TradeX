import React from "react";
import type { UserInfo } from "../utils/dashboardHelpers";
import styles from "../AdminUsers.module.css";
import Modal from "./Modal";

interface ReferralTreeModalProps {
  selectedUser: UserInfo;
  treeLoading: boolean;
  tree: UserInfo[];
  closeModal: () => void;
  closeBtnRef: React.RefObject<HTMLButtonElement | null>;
}

export default function ReferralTreeModal({
  selectedUser,
  treeLoading,
  tree,
  closeModal,
  closeBtnRef,
}: ReferralTreeModalProps) {
  function getDepth(path: string) {
    return (path.match(/\./g) || []).length - 1;
  }

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="Downstream Network Topology"
      subtitle={selectedUser.email}
      size="lg"
      closeBtnRef={closeBtnRef}
    >
      <div className={styles.modalBody} style={{ padding: 0 }}>
        {treeLoading ? (
          <div className={styles.emptyState}>Analyzing node pathways...</div>
        ) : tree.length === 0 ? (
          <div className={styles.emptyState}>
            This account has no downstream referrals.
          </div>
        ) : (
          <div className={styles.treeList}>
            {tree.map((n) => {
              const relDepth =
                getDepth(n.referralPath || "") -
                getDepth(selectedUser.referralPath || "");
              const depthLabel = relDepth <= 3 ? `Tier ${relDepth}` : `Tier ${relDepth}+`;
              const depthClass =
                relDepth === 1
                  ? styles.badgeL1
                  : relDepth === 2
                  ? styles.badgeL2
                  : relDepth === 3
                  ? styles.badgeL3
                  : styles.badgeLSub;
              const indentPadding = (relDepth - 1) * 36;

              return (
                <div
                  key={n.id}
                  className={`${styles.treeNode} ${
                    relDepth > 1 ? styles.treeChildNode : ""
                  }`}
                  style={{
                    paddingLeft: `${indentPadding + 16}px`,
                    ["--indent" as any]: `${indentPadding}px`,
                  }}
                >
                  <span className={`${styles.depthBadge} ${depthClass}`}>
                    {depthLabel}
                  </span>
                  <div className={styles.treeInfo}>
                    <div className={styles.treeEmail}>{n.email}</div>
                    <div className={styles.treeMeta}>
                      Code: {n.referralCode} · Points:{" "}
                      {(n.pointsBalance || 0).toLocaleString()}
                      {n.phoneNumber && ` · Phone: ${n.phoneNumber}`}
                      {n.accountNumber && ` · Account: ${n.accountNumber}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
