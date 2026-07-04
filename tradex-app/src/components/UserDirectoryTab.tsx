import { useState, useRef } from "react";
import UserAuditRegistry from "./UserAuditRegistry";
import AdminUserControlModal from "./AdminUserControlModal";
import AdjustPointsModal from "./AdjustPointsModal";
import ResetPasswordConfirmModal from "./ResetPasswordConfirmModal";
import ReferralTreeModal from "./ReferralTreeModal";
import Toast from "./Toast";
import { useAdminTelemetry } from "../hooks/useDashboard";
import {
  useReferralTree,
  useUpdateUserStatus,
  useResetUserPassword,
  useAdjustUserPoints,
  type AdminAction,
} from "../hooks/useAdmin";
import type { UserInfo } from "../utils/dashboardHelpers";

type ModalState =
  | { type: "controlPanel"; user: UserInfo }
  | { type: "points"; user: UserInfo }
  | { type: "network"; user: UserInfo }
  | { type: "resetConfirm"; user: UserInfo }
  | null;

interface ToastState {
  message: string;
  type: "success" | "error" | "warning" | "info";
}

export default function UserDirectoryTab() {
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  function showToast(message: string, type: ToastState["type"] = "success") {
    setToast({ message, type });
  }

  function handleMutationError(err: unknown) {
    const msg = (err as { message?: string })?.message ?? "Something went wrong";
    showToast(msg, "error");
  }

  // ── Queries & Mutations ──────────────────────────────────────────
  const { data: adminData, isLoading: adminLoading } = useAdminTelemetry(true);
  const users = (adminData?.usersList || []).filter((u) => u.role !== "ADMIN");

  const selectedUser = modal && "user" in modal
    ? users.find((u) => u.id === modal.user.id) || modal.user
    : null;

  const { data: treeData, isLoading: treeLoading } = useReferralTree(
    modal?.type === "network" ? modal.user.id : null
  );

  const statusMutation = useUpdateUserStatus({
    onSuccess: (_, action) => {
      const labels: Record<AdminAction, string> = {
        LOCK: "Account locked",
        UNLOCK: "Account unlocked",
        ENABLE: "Account enabled",
        DISABLE: "Account disabled",
        FORCE_EMAIL_VERIFY: "Email marked as verified",
      };
      showToast(labels[action]);
    },
    onError: handleMutationError,
  });

  const resetEmailMutation = useResetUserPassword({
    onSuccess: () => showToast("Password reset email sent"),
    onError: handleMutationError,
  });

  const adjustPointsMutation = useAdjustUserPoints({
    onSuccess: () => {
      setModal(null);
      showToast("Points balance updated");
    },
    onError: handleMutationError,
  });

  const act = (action: AdminAction, user: UserInfo) =>
    statusMutation.mutate({ userId: user.id, action });

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <UserAuditRegistry
        users={users}
        loading={adminLoading}
        onRowClick={(u) => setModal({ type: "controlPanel", user: u })}
      />

      {/* Referral Network Modal */}
      {modal?.type === "network" && selectedUser && (
        <ReferralTreeModal
          selectedUser={selectedUser}
          treeLoading={treeLoading}
          tree={treeData || []}
          closeModal={() => setModal(null)}
          closeBtnRef={closeBtnRef}
        />
      )}

      {/* Admin User Control Modal */}
      {modal?.type === "controlPanel" && selectedUser && (
        <AdminUserControlModal
          user={selectedUser}
          onClose={() => setModal(null)}
          hasNetwork={users.some((other) => other.referredByEmail === selectedUser.email)}
          onLock={() => act("LOCK", selectedUser)}
          onUnlock={() => act("UNLOCK", selectedUser)}
          onEnable={() => act("ENABLE", selectedUser)}
          onDisable={() => act("DISABLE", selectedUser)}
          onVerifyEmail={() => act("FORCE_EMAIL_VERIFY", selectedUser)}
          onSendResetEmail={() => setModal({ type: "resetConfirm", user: selectedUser })}
          onAdjustPoints={() => setModal({ type: "points", user: selectedUser })}
          viewNetwork={() => setModal({ type: "network", user: selectedUser })}
        />
      )}

      {/* Adjust Points Modal */}
      {modal?.type === "points" && selectedUser && (
        <AdjustPointsModal
          user={selectedUser}
          onClose={() => setModal(null)}
          isPending={adjustPointsMutation.isPending}
          onConfirm={(delta, reason) =>
            adjustPointsMutation.mutate({ userId: selectedUser.id, delta, reason })
          }
        />
      )}

      {/* Reset Password Confirm */}
      {modal?.type === "resetConfirm" && selectedUser && (
        <ResetPasswordConfirmModal
          user={selectedUser}
          isPending={resetEmailMutation.isPending}
          onClose={() => setModal(null)}
          onConfirm={() => {
            resetEmailMutation.mutate(selectedUser.id);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
