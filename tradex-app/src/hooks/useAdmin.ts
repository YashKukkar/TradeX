import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import type { UserInfo, SystemSetting } from "../utils/dashboardHelpers";
import type { AuditLogItem } from "../components/AdminAuditLogsRegistry";
import type { PendingTransaction } from "../components/PendingTransactionsRegistry";

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  number: number;
}

export type AdminAction =
  | "LOCK" | "UNLOCK" | "ENABLE" | "DISABLE" | "FORCE_EMAIL_VERIFY";

// ── Queries ──────────────────────────────────────────────────────────

export function useReferralTree(userId: number | null) {
  return useQuery<UserInfo[]>({
    queryKey: ["referralTree", userId],
    queryFn: () => api(`/admin/users/${userId}/referral-tree`),
    enabled: userId !== null,
  });
}

export function useAdminAuditLogs(page: number, enabled: boolean) {
  return useQuery<PageResponse<AuditLogItem>>({
    queryKey: ["adminAuditLogs", page],
    queryFn: () => api(`/admin/audit-logs?page=${page}&size=50&sort=createdAt,desc`),
    enabled,
  });
}

export function usePendingTransactions() {
  return useQuery<PendingTransaction[]>({
    queryKey: ["pendingTransactions"],
    queryFn: () => api("/admin/transactions/pending"),
  });
}

export function useAllTransactions(enabled: boolean) {
  return useQuery<PendingTransaction[]>({
    queryKey: ["allTransactions"],
    queryFn: () => api("/admin/transactions"),
    enabled,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useUpdateUserStatus(options?: {
  onSuccess?: (user: UserInfo, action: AdminAction) => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation<UserInfo, Error, { userId: number; action: AdminAction }>({
    mutationFn: ({ userId, action }) =>
      api(`/admin/users/${userId}/status`, { method: "PATCH", body: JSON.stringify({ action }) }),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["adminTelemetry"] });
      options?.onSuccess?.(data, vars.action);
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useResetUserPassword(options?: {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) {
  return useMutation<void, Error, number>({
    mutationFn: (userId) => api(`/admin/users/${userId}/reset-password`, { method: "POST" }),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useAdjustUserPoints(options?: {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation<
    UserInfo,
    Error,
    { userId: number; delta: number; reason: string }
  >({
    mutationFn: ({ userId, delta, reason }) =>
      api(`/admin/users/${userId}/points`, {
        method: "POST",
        body: JSON.stringify({ delta, reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTelemetry"] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useSaveSystemSettings(options?: {
  onSuccess?: (data: SystemSetting) => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation<SystemSetting, Error, SystemSetting>({
    mutationFn: (newSettings) =>
      api("/admin/settings", { method: "PUT", body: JSON.stringify(newSettings) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminTelemetry"] });
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useApproveTransaction(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id: number) =>
      api(`/admin/transactions/${id}/approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["allTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["adminTelemetry"] });
      options?.onSuccess?.();
    },
  });
}

export function useRejectTransaction(options?: {
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; reason: string }>({
    mutationFn: ({ id, reason }) =>
      api(`/admin/transactions/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["allTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["adminTelemetry"] });
      options?.onSuccess?.();
    },
  });
}
