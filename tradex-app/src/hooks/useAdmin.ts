import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";
import type { UserInfo, SystemSetting } from "../utils/dashboardHelpers";
import { useCurrentUser } from "./useDashboard";

const updateTelemetryCache = (queryClient: any, email: string | undefined, updatedUser: UserInfo) => {
  queryClient.setQueryData(["adminTelemetry", email], (old: any) => {
    if (!old) return old;
    return {
      ...old,
      usersList: old.usersList.map((u: any) => u.id === updatedUser.id ? updatedUser : u),
    };
  });
};
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

export function useAdminAuditLogs(page: number, enabled: boolean, targetEmail?: string) {
  return useQuery<PageResponse<AuditLogItem>>({
    queryKey: ["adminAuditLogs", page, targetEmail],
    queryFn: () => {
      const emailParam = targetEmail ? `&targetEmail=${encodeURIComponent(targetEmail)}` : "";
      return api(`/admin/audit-logs?page=${page}&size=50&sort=createdAt,desc${emailParam}`);
    },
    enabled,
  });
}

export function usePendingTransactions() {
  return useQuery<PendingTransaction[]>({
    queryKey: ["pendingTransactions"],
    queryFn: () => api("/admin/transactions/pending"),
    refetchInterval: 5000,
  });
}

export function useAllTransactions(enabled: boolean) {
  return useQuery<PendingTransaction[]>({
    queryKey: ["allTransactions"],
    queryFn: () => api("/admin/transactions"),
    enabled,
    refetchInterval: 5000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────

export function useUpdateUserStatus(options?: {
  onSuccess?: (user: UserInfo, action: AdminAction) => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  return useMutation<UserInfo, Error, { userId: number; action: AdminAction }>({
    mutationFn: ({ userId, action }) =>
      api(`/admin/users/${userId}/status`, { method: "PATCH", body: JSON.stringify({ action }) }),
    onSuccess: (data, vars) => {
      updateTelemetryCache(queryClient, currentUser?.email, data);
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
  const { data: currentUser } = useCurrentUser();
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
    onSuccess: (data) => {
      updateTelemetryCache(queryClient, currentUser?.email, data);
      queryClient.invalidateQueries({ queryKey: ["adminTelemetry"] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useAdjustUserWallet(options?: {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  return useMutation<
    UserInfo,
    Error,
    { userId: number; delta: number; walletType: "CASH" | "BONUS"; reason: string }
  >({
    mutationFn: ({ userId, delta, walletType, reason }) =>
      api(`/admin/users/${userId}/wallet`, {
        method: "POST",
        body: JSON.stringify({ delta, walletType, reason }),
      }),
    onSuccess: (data) => {
      updateTelemetryCache(queryClient, currentUser?.email, data);
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

export function useEmployees() {
  return useQuery<UserInfo[]>({
    queryKey: ["employeesList"],
    queryFn: () => api("/admin/employees"),
  });
}

export interface PermissionRegistryData {
  key: string;
  displayName: string;
  description: string;
  category: string;
}

export function useSystemPermissions() {
  return useQuery<PermissionRegistryData[]>({
    queryKey: ["systemPermissions"],
    queryFn: () => api("/admin/permissions"),
  });
}

export function useCreateEmployee(options?: {
  onSuccess?: (employee: UserInfo) => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation<UserInfo, Error, { email: string; password: string; permissions: string[]; teams: string[] }>({
    mutationFn: (body) =>
      api("/admin/employees", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employeesList"] });
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useUpdateEmployeePermissions(options?: {
  onSuccess?: (employee: UserInfo) => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation<UserInfo, Error, { employeeId: number; permissions: string[] }>({
    mutationFn: ({ employeeId, permissions }) =>
      api(`/admin/employees/${employeeId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employeesList"] });
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useDeleteEmployee(options?: {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (employeeId) =>
      api(`/admin/employees/${employeeId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeesList"] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export interface TeamData {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

export function useTeams() {
  return useQuery<TeamData[]>({
    queryKey: ["teamsList"],
    queryFn: () => api("/admin/teams"),
  });
}

export function useCreateTeam(options?: { onSuccess?: () => void; onError?: (err: Error) => void }) {
  const queryClient = useQueryClient();
  return useMutation<TeamData, Error, { name: string; description: string; permissions: string[] }>({
    mutationFn: (body) =>
      api("/admin/teams", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamsList"] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useUpdateTeam(options?: { onSuccess?: () => void; onError?: (err: Error) => void }) {
  const queryClient = useQueryClient();
  return useMutation<TeamData, Error, { id: number; name: string; description: string; permissions: string[] }>({
    mutationFn: ({ id, ...body }) =>
      api(`/admin/teams/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamsList"] });
      queryClient.invalidateQueries({ queryKey: ["employeesList"] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useDeleteTeam(options?: { onSuccess?: () => void; onError?: (err: Error) => void }) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) =>
      api(`/admin/teams/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamsList"] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}

export function useUpdateEmployeeTeams(options?: { onSuccess?: () => void; onError?: (err: Error) => void }) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { employeeId: number; teams: string[] }>({
    mutationFn: ({ employeeId, teams }) =>
      api(`/admin/teams/employee/${employeeId}`, {
        method: "PUT",
        body: JSON.stringify({ teams }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeesList"] });
      options?.onSuccess?.();
    },
    onError: (err) => {
      options?.onError?.(err);
    },
  });
}
